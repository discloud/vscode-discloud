import { t } from "@vscode/l10n";
import { DiscloudConfig, resolveFile, type RESTPostApiUploadResult, Routes } from "discloud.app";
import { CancellationError, ProgressLocation, Uri } from "vscode";
import { type TaskData } from "../@types";
import type ExtensionCore from "../core/extension";
import { socketUpload } from "../services/discloud/socket/actions/upload";
import Command from "../structures/Command";
import FileSystem from "../utils/FileSystem";
import Zip from "../utils/Zip";
import { ApiActionsStrategy, ConfigKeys } from "../utils/constants";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.upload.title"),
      },
    });
  }

  async run(task: TaskData) {
    const workspaceFolder = await this.core.getWorkspaceFolder({ token: task.token });
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    if (!await this.confirmAction())
      throw new CancellationError();

    this.core.statusBar.setUploading();

    task.progress.report({ increment: 30, message: t("files.checking") });

    const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

    if (!dConfig.validate(true))
      throw Error(t("invalid.discloud.config"));

    const fs = new FileSystem({
      cwd: workspaceFolder.fsPath,
      ignoreFile: ".discloudignore",
      ignoreList: this.core.workspaceIgnoreList,
    });

    const found = await fs.findFiles(task.token);
    if (!found.length) throw Error(t("files.missing"));

    const main = dConfig.data.MAIN && Uri.parse(dConfig.data.MAIN).fsPath;

    if (!main || !found.some(uri => uri.fsPath.endsWith(main)))
      throw Error([
        t("missing.discloud.config.main", { file: `${dConfig.data.MAIN}` }),
        t("readdiscloudconfigdocs"),
      ].join("\n"));

    task.progress.report({ increment: 30, message: t("files.zipping") });

    const zipper = new Zip();

    await zipper.appendUriList(found);

    const buffer = await zipper.getBuffer();

    const strategy = this.core.config.get(ConfigKeys.apiActionsStrategy, ApiActionsStrategy.socket);

    await this[strategy](task, buffer, dConfig);
  }

  async rest(task: TaskData, buffer: Buffer, dConfig: DiscloudConfig) {
    task.progress.report({ increment: -1, message: t("uploading") });

    const file = await resolveFile(buffer, "file.zip");

    const files: File[] = [file];

    const response = await this.core.api.post<RESTPostApiUploadResult>(Routes.upload(), { files });

    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      if ("app" in response && response.app) {
        dConfig.update({ ID: response.app.id, AVATAR: response.app.avatarURL });
        await this.core.appTree.fetch();
      }

      if (response.logs) {
        this.logger("app" in response && response.app ? response.app.id : "Discloud Upload Error", response.logs);
      }
    }
  }

  async socket(task: TaskData, buffer: Buffer, dConfig: DiscloudConfig) {
    await socketUpload(task, buffer, dConfig);
  }
}
