import { t } from "@vscode/l10n";
import { DiscloudConfig, GS, resolveFile, RESTPostApiUploadResult, Routes } from "discloud.app";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { FormData } from "undici";
import { ProgressLocation, window, workspace } from "vscode";
import { TaskData } from "../@types";
import extension from "../extension";
import Command from "../structures/Command";
import { matchOnArray, requester, Zip } from "../util";

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

    if (!existsSync(join(workspaceFolder, dConfig.data.MAIN))) {
      window.showErrorMessage(t("invalid.discloud.config.main", {
        file: dConfig.data.MAIN,
      }) + "\n" + t("readdiscloudconfigdocs"));

      throw Error(t("invalid.discloud.config.main", {
        file: dConfig.data.MAIN,
      }));
    };

    const zipName = `${workspace.name}.zip`;

    const { found } = new GS(workspaceFolder, "\\.discloudignore",
      extension.workspaceIgnoreList.concat(`${workspaceFolder}/${zipName}`));

    if (!found.length) {
      window.showErrorMessage(t("files.missing"));
      throw Error(t("files.missing"));
    }

    if (!matchOnArray(found, dConfig.data.MAIN)) {
      window.showErrorMessage(t("missing.discloud.config.main", {
        file: dConfig.data.MAIN,
      }) + "\n" + t("readdiscloudconfigdocs"));

      throw Error(t("missing.discloud.config.main", {
        file: dConfig.data.MAIN,
      }));
    }

    task.progress.report({ message: t("file.zipping") });

    const savePath = join(workspaceFolder, zipName);

    let zipper;
    try {
      zipper = new Zip(savePath);
      zipper.appendFileList(found, workspaceFolder, true);
      await zipper.finalize();
    } catch (error: any) {
      zipper?.destroy();
      extension.emit("error", error);
      throw Error(error);
    }

    const form = new FormData();
    try {
      form.append("file", await resolveFile(savePath, zipName));
    } catch (error: any) {
      zipper.destroy();
      extension.emit("error", error);
      throw Error(error);
    }

    task.progress.report({ message: t("uploading") });

    const res = await requester<RESTPostApiUploadResult>(Routes.upload(), {
      body: form,
      headersTimeout: 420000,
      method: "POST",
    });

    zipper.destroy();
    extension.resetStatusBar();

    if ("status" in res) {
      this.showApiMessage(res);

      if (res.app) {
        dConfig.update({ ID: res.app.id, AVATAR: res.app.avatarURL });
        extension.appTree.addRawApp(res.app);
        extension.appTree.getStatus(res.app.id);
      }

      if (res.logs) this.logger(res.app.id, res.logs);
    }
  }
}
