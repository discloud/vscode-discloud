import { t } from "@vscode/l10n";
import { type RESTPutApiAppCommitResult, Routes, resolveFile } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../@types";
import extension from "../extension";
import { socketCommit } from "../services/discloud/socket/upload/commit";
import AppTreeItem from "../structures/AppTreeItem";
import Command from "../structures/Command";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";
import FileSystem from "../util/FileSystem";
import Zip from "../util/Zip";

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
    const workspaceFolder = await extension.getWorkspaceFolder();
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    const fileNames = await FileSystem.readSelectedPath(true);

    if (!await this.confirmAction())
      throw new CancellationError();

    extension.statusBar.setCommitting();

    const picked = await this.pickAppOrTeamApp(task, { showOther: true });
    if (!picked.id) throw Error(t("missing.appid"));

    task.progress.report({ increment: 30, message: t("files.checking") });

    const fs = new FileSystem({
      fileNames,
      ignoreFile: ".discloudignore",
      ignoreList: extension.workspaceIgnoreList,
    });

    const found = await fs.findFiles(task.token);
    if (!found.length) throw Error(t("files.missing"));

    task.progress.report({ increment: 30, message: t("files.zipping") });

    const zipper = new Zip();

    await zipper.appendUriList(found);

    const buffer = await zipper.getBuffer();

    const strategy = "rest"; // extension.config.get(ConfigKeys.uploadStrategy, UploadStrategy.socket);

    await this[strategy](task, buffer, picked.app);
  }

  async rest(task: TaskData, buffer: Buffer, app: AppTreeItem | TeamAppTreeItem) {
    task.progress.report({ increment: -1, message: t("committing") });

    const file = await resolveFile(buffer, "file.zip");

    const files: File[] = [file];

    const isUserApp = app instanceof AppTreeItem;

    const res = await extension.api.put<RESTPutApiAppCommitResult>(
      isUserApp ? Routes.appCommit(app.appId) : Routes.teamCommit(app.appId),
      { files },
    );

    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      if (isUserApp)
        await extension.appTree.fetch();
      else
        await extension.teamAppTree.fetch();

      if (res.logs) this.logger(app.output ?? app.appId, res.logs);
    }
  }

  async socket(task: TaskData, buffer: Buffer, app: AppTreeItem | TeamAppTreeItem) {
    await socketCommit(task, buffer, app);
  }
}
