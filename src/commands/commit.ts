import { t } from "@vscode/l10n";
import { GS, resolveFile, RESTPutApiAppCommitResult, Routes } from "discloud.app";
import { join } from "node:path";
import { FormData } from "undici";
import { ProgressLocation, window, workspace } from "vscode";
import { TaskData } from "../@types";
import extension from "../extension";
import Command from "../structures/Command";
import { requester, Zip } from "../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.commit.title"),
      },
    });
  }

  async run(task: TaskData) {
    if (!extension.workspaceFolder) return;
    const workspaceFolder = extension.workspaceFolder;

    const paths = await extension.copyFilePath();

    if (!await this.confirmAction()) return;

    extension.statusBar.setCommitting();

    const appId = await this.pickApp(task, true);
    if (!appId) return;

    task.progress.report({
      message: t("files.checking"),
      increment: 10,
    });

    const configAppBackupDir = extension.config.get<string>("app.backup.dir");
    const configTeamBackupDir = extension.config.get<string>("team.backup.dir");
    const zipName = `${workspace.name}.zip`;

    const files = new GS(paths, ".discloudignore", [
      `${workspaceFolder}/discloud/**`,
      `${workspaceFolder}/${configAppBackupDir}/**`,
      `${workspaceFolder}/${configTeamBackupDir}/**`,
      `${workspaceFolder}/${zipName}`,
    ]).found;

    task.progress.report({
      message: t("file.zipping"),
      increment: 20,
    });

    const savePath = join(workspaceFolder, zipName);

    let zipper;
    try {
      zipper = new Zip(savePath);
      zipper.appendFileList(files, workspaceFolder, true);
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
      message: t("committing"),
      increment: 30,
    });

    const data = await requester<RESTPutApiAppCommitResult>(Routes.appCommit(appId), {
      body: form,
      headersTimeout: 420000,
      method: "PUT",
    });

    task.progress.report({ increment: 100 });
    zipper.destroy();
    extension.resetStatusBar();

    if ("status" in data) {
      this.showApiMessage(data);

      await extension.appTree.getStatus(appId);

      if (data.logs) this.logger(appId, data.logs);
    }
  }
}