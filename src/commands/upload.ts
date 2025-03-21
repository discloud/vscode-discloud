import { t } from "@vscode/l10n";
import { DiscloudConfig, type RESTPostApiUploadResult, Routes, resolveFile } from "discloud.app";
import { ProgressLocation, Uri, workspace } from "vscode";
import { type TaskData } from "../@types";
import extension from "../extension";
import Command from "../structures/Command";
import FileSystem from "../util/FileSystem";
import Zip from "../util/Zip";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.upload.title"),
      },
    });
  }

  async run(task: TaskData) {
    const workspaceFolder = await extension.getWorkspaceFolder();
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    if (!await this.confirmAction())
      throw Error(t("rejected.action"));

    extension.statusBar.setUploading();

    task.progress.report({ increment: 30, message: t("files.checking") });

    const dConfig = new DiscloudConfig(workspaceFolder.fsPath);

    if (!dConfig.validate(true))
      throw Error(t("invalid.discloud.config"));

    const zipName = `${workspace.name}.zip`;

    const fs = new FileSystem({
      ignoreFile: ".discloudignore",
      ignoreList: extension.workspaceIgnoreList,
    });

    const found = await fs.findFiles(task.token);
    if (!found.length) throw Error(t("files.missing"));

    const main = Uri.parse(dConfig.data.MAIN).fsPath;

    if (!found.some(uri => uri.fsPath.endsWith(main)))
      throw Error([
        t("missing.discloud.config.main", { file: dConfig.data.MAIN }),
        t("readdiscloudconfigdocs"),
      ].join("\n"));

    task.progress.report({ increment: 30, message: t("files.zipping") });

    const zipper = new Zip();
    await zipper.appendUriList(found);

    const saveUri = Uri.joinPath(workspaceFolder, zipName);

    const files = [];
    try {
      files.push(await resolveFile(zipper.getBuffer(), zipName));
    } catch (error) {
      if (extension.isDebug) await zipper.writeZip(saveUri.fsPath);
      throw error;
    }

    task.progress.report({ increment: -1, message: t("uploading") });

    const res = await extension.api.post<RESTPostApiUploadResult>(Routes.upload(), { files });

    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      if ("app" in res && res.app) {
        dConfig.update({ ID: res.app.id, AVATAR: res.app.avatarURL });
        await extension.appTree.fetch();
      }

      if (res.logs) {
        this.logger("app" in res && res.app ? res.app.id : "Discloud Upload Error", res.logs);
      }
    }
  }
}
