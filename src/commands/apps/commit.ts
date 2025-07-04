import { t } from "@vscode/l10n";
import { type RESTPutApiAppCommitResult, Routes, resolveFile } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import { socketCommit } from "../../services/discloud/socket/actions/commit";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
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

  async run(task: TaskData, item: AppTreeItem) {
    const workspaceFolder = await extension.getWorkspaceFolder({ token: task.token });
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    if (!await this.confirmAction())
      throw new CancellationError();

    extension.statusBar.setCommitting();

    task.progress.report({ increment: 30, message: `${item.appId} - ${t("choose.files")}` });

    const fs = new FileSystem({
      cwd: workspaceFolder.fsPath,
      ignoreFile: ".discloudignore",
      ignoreList: extension.workspaceIgnoreList,
    });

    const found = await fs.findFiles(task.token);
    if (!found.length) throw Error(t("files.missing"));

    task.progress.report({ increment: 30, message: t("files.zipping") });

    const zipper = new Zip();

    await zipper.appendUriList(found);

    const buffer = await zipper.getBuffer();

    const strategy = extension.config.get(ConfigKeys.apiActionsStrategy, ApiActionsStrategy.socket);

    await this[strategy](task, buffer, item);
  }

  async rest(task: TaskData, buffer: Buffer, app: AppTreeItem) {
    task.progress.report({ increment: -1, message: t("committing") });

    const file = await resolveFile(buffer, "file.zip");

    const files: File[] = [file];

    const response = await extension.api.put<RESTPutApiAppCommitResult>(Routes.appCommit(app.appId), { files });

    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await extension.appTree.fetch();

      if (response.logs) this.logger(app.output ?? app.appId, response.logs);
    }
  }

  async socket(task: TaskData, buffer: Buffer, app: AppTreeItem) {
    await socketCommit(task, buffer, app);
  }
}
