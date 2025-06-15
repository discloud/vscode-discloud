import { t } from "@vscode/l10n";
import { type RESTPutApiAppCommitResult, Routes, resolveFile } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import { socketCommit } from "../../services/discloud/socket/upload/commit";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";
import FileSystem from "../../util/FileSystem";
import Zip from "../../util/Zip";
import { ApiActionsStrategy, ConfigKeys } from "../../util/constants";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.commit.title"),
      },
    });
  }

  async run(task: TaskData, item?: TeamAppTreeItem) {
    const workspaceFolder = await extension.getWorkspaceFolder();
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false, startInTeamApps: true });
      item = picked.app;
    }

    if (!await this.confirmAction())
      throw new CancellationError();

    extension.statusBar.setCommitting();

    task.progress.report({ increment: 30, message: `${item.appId} - ${t("choose.files")}` });

    const fs = new FileSystem({
      ignoreFile: ".discloudignore",
      ignoreList: extension.workspaceIgnoreList,
    });

    const found = await fs.findFiles(false);
    if (!found.length) throw Error(t("files.missing"));

    task.progress.report({ increment: 30, message: t("files.zipping") });

    const zipper = new Zip();

    await zipper.appendUriList(found);

    const buffer = await zipper.getBuffer();

    const strategy = extension.config.get(ConfigKeys.apiActionsStrategy, ApiActionsStrategy.socket);

    await this[strategy](task, buffer, item);
  }

  async rest(task: TaskData, buffer: Buffer, app: TeamAppTreeItem) {
    task.progress.report({ increment: -1, message: t("committing") });

    const file = await resolveFile(buffer, "file.zip");

    const files: File[] = [file];

    const res = await extension.api.put<RESTPutApiAppCommitResult>(Routes.teamCommit(app.appId), { files });

    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.teamAppTree.fetch();

      if (res.logs) this.logger(app.output ?? app.appId, res.logs);
    }
  }

  async socket(task: TaskData, buffer: Buffer, app: TeamAppTreeItem) {
    await socketCommit(task, buffer, app);
  }
}
