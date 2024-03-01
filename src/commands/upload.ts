import { t } from "@vscode/l10n";
import { DiscloudConfig, RESTPostApiUploadResult, Routes } from "discloud.app";
import { join } from "path";
import { FormData } from "undici";
import { ProgressLocation, Uri, window, workspace } from "vscode";
import { TaskData } from "../@types";
import extension from "../extension";
import Command from "../structures/Command";
import { FileSystem, requester, Zip } from "../util";
import resolveFile from "../util/resolveFile";

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
    const workspaceFolder = extension.workspaceFolder;
    if (!workspaceFolder) throw Error("No workspace folder found");

    if (!await this.confirmAction())
      throw Error("Reject action");

    extension.statusBar.setUploading();

    task.progress.report({ message: t("files.checking") });

    const dConfig = new DiscloudConfig(workspaceFolder);

    if (!dConfig.exists || dConfig.missingProps.length) {
      window.showErrorMessage(t("invalid.discloud.config"));
      throw Error(t("invalid.discloud.config"));
    }

    const zipName = `${workspace.name}.zip`;

    const fs = new FileSystem({
      ignoreFile: ".discloudignore",
      ignoreList: extension.workspaceIgnoreList,
    });

    const found = await fs.findFiles(false);

    if (!found.length) {
      window.showErrorMessage(t("files.missing"));
      throw Error(t("files.missing"));
    }

    const main = Uri.parse(dConfig.data.MAIN).fsPath;

    if (!found.some(uri => uri.fsPath.endsWith(main))) {
      window.showErrorMessage(t("missing.discloud.config.main", { file: dConfig.data.MAIN })
        + "\n" + t("readdiscloudconfigdocs"));

      throw Error(t("missing.discloud.config.main", { file: dConfig.data.MAIN }));
    }

    task.progress.report({ message: t("files.zipping") });

    const savePath = join(workspaceFolder, zipName);

    let zipper;
    try {
      zipper = new Zip(savePath);
      zipper.appendUriList(found, true);
      await zipper.finalize();
    } catch (error: any) {
      zipper?.destroy();
      throw Error(error);
    }

    const form = new FormData();
    try {
      form.append("file", await resolveFile(savePath, zipName));
      if (!extension.isDebug) zipper.destroy();
    } catch (error: any) {
      zipper.destroy();
      throw Error(error);
    }

    task.progress.report({ message: t("uploading") });

    const res = await requester<RESTPostApiUploadResult>(Routes.upload(), {
      body: form,
      headersTimeout: 420000,
      method: "POST",
    });

    extension.resetStatusBar();

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
