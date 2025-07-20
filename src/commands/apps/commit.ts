import { type RESTPutApiAppCommitResult, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import { socketCommit } from "../../services/discloud/socket/actions/commit";
import Command from "../../structures/Command";
import type UserAppTreeItem from "../../structures/UserAppTreeItem";
import FileSystem from "../../utils/FileSystem";
import Zip from "../../utils/Zip";
import { ApiActionsStrategy, ConfigKeys } from "../../utils/constants";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.commit.title"),
      },
    });
  }

  async run(task: TaskData, item: UserAppTreeItem) {
    const workspaceFolder = await this.core.getWorkspaceFolder({ token: task.token });
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    if (!await this.confirmAction())
      throw new CancellationError();

    this.core.statusBar.setCommitting();

    task.progress.report({ increment: 30, message: `${item.appId} - ${t("choose.files")}` });

    const fs = new FileSystem({
      cwd: workspaceFolder.fsPath,
      ignoreFile: ".discloudignore",
      ignoreList: this.core.workspaceIgnoreList,
    });

    const found = await fs.findFiles(task.token);
    if (!found.length) throw Error(t("files.missing"));

    task.progress.report({ increment: 30, message: t("files.zipping") });

    const zipper = new Zip();

    await zipper.appendUriList(found);

    const buffer = await zipper.getBuffer();

    const strategy = this.core.config.get(ConfigKeys.apiActionsStrategy, ApiActionsStrategy.socket);

    await this[strategy](task, buffer, item);
  }

  async rest(task: TaskData, buffer: Buffer, app: UserAppTreeItem) {
    task.progress.report({ increment: -1, message: t("committing") });

    const file = new File([buffer], "file.zip");

    const files: File[] = [file];

    const response = await this.core.api.put<RESTPutApiAppCommitResult>(Routes.appCommit(app.appId), { files });

    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await this.core.userAppTree.fetch();

      if (response.logs) this.logger(app.output ?? app.appId, response.logs);
    }
  }

  async socket(task: TaskData, buffer: Buffer, app: UserAppTreeItem) {
    await socketCommit(this.core, task, buffer, app);
  }
}
