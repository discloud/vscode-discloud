import { t } from "@vscode/l10n";
import { type RESTPutApiAppCommitResult, Routes, resolveFile } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import core from "../../extension";
import { socketCommit } from "../../services/discloud/socket/actions/commit";
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

  async run(task: TaskData, item: TeamAppTreeItem) {
    const workspaceFolder = await core.getWorkspaceFolder({ token: task.token });
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    if (!await this.confirmAction())
      throw new CancellationError();

    core.statusBar.setCommitting();

    task.progress.report({ increment: 30, message: `${item.appId} - ${t("choose.files")}` });

    const fs = new FileSystem({
      cwd: workspaceFolder.fsPath,
      ignoreFile: ".discloudignore",
      ignoreList: core.workspaceIgnoreList,
    });

    const found = await fs.findFiles(false);
    if (!found.length) throw Error(t("files.missing"));

    task.progress.report({ increment: 30, message: t("files.zipping") });

    const zipper = new Zip();

    await zipper.appendUriList(found);

    const buffer = await zipper.getBuffer();

    const strategy = core.config.get(ConfigKeys.apiActionsStrategy, ApiActionsStrategy.socket);

    await this[strategy](task, buffer, item);
  }

  async rest(task: TaskData, buffer: Buffer, app: TeamAppTreeItem) {
    task.progress.report({ increment: -1, message: t("committing") });

    const file = await resolveFile(buffer, "file.zip");

    const files: File[] = [file];

    const response = await core.api.put<RESTPutApiAppCommitResult>(Routes.teamCommit(app.appId), { files });
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await core.teamAppTree.fetch();

      if (response.logs) this.logger(app.output ?? app.appId, response.logs);
    }
  }

  async socket(task: TaskData, buffer: Buffer, app: TeamAppTreeItem) {
    await socketCommit(task, buffer, app);
  }
}
