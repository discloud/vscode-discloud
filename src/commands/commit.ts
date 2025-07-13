import { t } from "@vscode/l10n";
import { type RESTPutApiAppCommitResult, Routes, resolveFile } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../@types";
import core from "../extension";
import { socketCommit } from "../services/discloud/socket/actions/commit";
import AppTreeItem from "../structures/AppTreeItem";
import Command from "../structures/Command";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";
import FileSystem from "../utils/FileSystem";
import Zip from "../utils/Zip";
import { pickApp } from "../utils/apps";
import { ApiActionsStrategy, ConfigKeys } from "../utils/constants";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.commit.title"),
      },
    });
  }

  async run(task: TaskData) {
    const workspaceFolder = await core.getWorkspaceFolder({ token: task.token });
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    const fileNames = await FileSystem.readSelectedPath(true);

    if (!await this.confirmAction())
      throw new CancellationError();

    core.statusBar.setCommitting();

    const item = await pickApp({ token: task.token });
    if (!item) throw Error(t("missing.appid"));

    task.progress.report({ increment: 30, message: t("files.checking") });

    const fs = new FileSystem({
      cwd: workspaceFolder.fsPath,
      fileNames,
      ignoreFile: ".discloudignore",
      ignoreList: core.workspaceIgnoreList,
    });

    const found = await fs.findFiles(task.token);
    if (!found.length) throw Error(t("files.missing"));

    task.progress.report({ increment: 30, message: t("files.zipping") });

    const zipper = new Zip();

    await zipper.appendUriList(found);

    const buffer = await zipper.getBuffer();

    const strategy = core.config.get(ConfigKeys.apiActionsStrategy, ApiActionsStrategy.socket);

    await this[strategy](task, buffer, item);
  }

  async rest(task: TaskData, buffer: Buffer, app: AppTreeItem | TeamAppTreeItem) {
    task.progress.report({ increment: -1, message: t("committing") });

    const file = await resolveFile(buffer, "file.zip");

    const files: File[] = [file];

    const isUserApp = app instanceof AppTreeItem;

    const response = await core.api.put<RESTPutApiAppCommitResult>(
      isUserApp ? Routes.appCommit(app.appId) : Routes.teamCommit(app.appId),
      { files },
    );
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      if (isUserApp)
        await core.appTree.fetch();
      else
        await core.teamAppTree.fetch();

      if (response.logs) this.logger(app.output ?? app.appId, response.logs);
    }
  }

  async socket(task: TaskData, buffer: Buffer, app: AppTreeItem | TeamAppTreeItem) {
    await socketCommit(task, buffer, app);
  }
}
