import { t } from "@vscode/l10n";
import { resolveFile, RESTPutApiAppCommitResult, Routes } from "discloud.app";
import { join } from "path";
import { FormData } from "undici";
import { ProgressLocation, window, workspace } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import Command from "../../structures/Command";
import TeamAppTreeItem from "../../structures/TeamAppTreeItem";
import { GS, requester, Zip } from "../../util";

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

  async run(task: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    if (!extension.workspaceFolder) return;
    const workspaceFolder = extension.workspaceFolder;

    if (!item.appId) {
      item.appId = await this.pickTeamApp(task, true);
      if (!item.appId) return;
    }

    if (!await this.confirmAction()) return;

    task.progress.report({ message: `${item.appId} - ${t("choose.files")}` });

    const configAppBackupDir = extension.config.get<string>("discloud.app.backup.dir");
    const configTeamBackupDir = extension.config.get<string>("discloud.team.backup.dir");

    const { found } = new GS(workspaceFolder, "\\.discloudignore", [
      `${workspaceFolder}/discloud/**`,
      `${workspaceFolder}/${configAppBackupDir}/**`,
      `${workspaceFolder}/${configTeamBackupDir}/**`,
    ]);

    task.progress.report({
      message: t("files.zipping"),
      increment: 20,
    });

    const zipName = `${workspace.name}.zip`;
    const savePath = join(workspaceFolder, zipName);

    let zipper;
    try {
      zipper = new Zip(savePath);
      zipper.appendFileList(found, workspaceFolder, true);
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

    task.progress.report({ message: item.appId });

    const res = await requester<RESTPutApiAppCommitResult>(Routes.teamCommit(item.appId), {
      body: form,
      headersTimeout: 420000,
      method: "PUT",
    });

    task.progress.report({ increment: 100 });
    zipper.destroy();
    extension.resetStatusBar();

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.teamAppTree.getStatus(item.appId);

      if (res.logs) this.logger(item.appId, res.logs);
    }
  }
}