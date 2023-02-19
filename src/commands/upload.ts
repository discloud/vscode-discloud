import { t } from "@vscode/l10n";
import { DiscloudConfig, resolveFile, RESTPostApiUploadResult, Routes } from "discloud.app";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { FormData } from "undici";
import { ProgressLocation, window, workspace } from "vscode";
import { TaskData } from "../@types";
import extension from "../extension";
import Command from "../structures/Command";
import { GS, matchOnArray, requester, Zip } from "../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.upload.title"),
      },
    });
  }

  async run(task: TaskData) {
    if (!extension.workspaceFolder) return;
    const targetPath = extension.workspaceFolder;

    if (!await this.confirmAction()) return;

    extension.statusBar.setUploading();

    task.progress.report({
      message: t("files.checking"),
      increment: 10,
    });

    const dConfig = new DiscloudConfig(targetPath);

    if (!dConfig.exists || dConfig.missingProps.length) {
      extension.resetStatusBar();
      window.showErrorMessage(t("invalid.discloud.config"));
      return;
    }

    if (!existsSync(join(targetPath, dConfig.data.MAIN))) {
      extension.resetStatusBar();
      window.showErrorMessage(t("invalid.discloud.config.main", {
        file: dConfig.data.MAIN,
      }) + "\n" + t("readdiscloudconfigdocs"));

      return;
    };

    const { found } = new GS(targetPath, "\\.discloudignore", [`${targetPath}/discloud/**`]);

    if (!found.length) {
      extension.resetStatusBar();
      window.showErrorMessage(t("files.missing"));
      return;
    }

    if (!matchOnArray(found, dConfig.data.MAIN)) {
      extension.resetStatusBar();
      window.showErrorMessage(t("missing.discloud.config.main", {
        file: dConfig.data.MAIN,
      }) + "\n" + t("readdiscloudconfigdocs"));
      return;
    }

    task.progress.report({
      message: t("file.zipping"),
      increment: 20,
    });

    const zipName = `${workspace.name}.zip`;
    const savePath = join(targetPath, zipName);

    let zipper;
    try {
      zipper = new Zip(savePath);
      zipper.appendFileList(found, targetPath);
      await zipper.finalize();
    } catch (error: any) {
      zipper?.destroy();
      extension.resetStatusBar();
      window.showErrorMessage(error);
      return;
    }

    const form = new FormData();
    try {
      form.append("file", await resolveFile(savePath, zipName));
    } catch (error: any) {
      zipper.destroy();
      extension.resetStatusBar();
      window.showErrorMessage(error);
      return;
    }

    task.progress.report({
      message: t("uploading"),
      increment: 30,
    });

    const res = await requester<RESTPostApiUploadResult>(Routes.upload(), {
      body: form,
      headersTimeout: 420000,
      method: "POST",
    });

    task.progress.report({ increment: 100 });
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
