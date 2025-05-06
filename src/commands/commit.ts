import { t } from "@vscode/l10n";
import { type RESTPutApiAppCommitResult, Routes, resolveFile } from "discloud.app";
import { CancellationError, ProgressLocation, Uri, workspace } from "vscode";
import { type TaskData } from "../@types";
import extension from "../extension";
import Command from "../structures/Command";
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

    const zipName = `${workspace.name}.zip`;

    const fs = new FileSystem({
      fileNames,
      ignoreFile: ".discloudignore",
      ignoreList: extension.workspaceIgnoreList,
    });

    const found = await fs.findFiles(task.token);
    if (!found.length) throw Error(t("files.missing"));

    task.progress.report({ increment: 30, message: t("files.zipping") });

    const saveUri = Uri.joinPath(workspaceFolder, zipName);

    const zipper = new Zip();

    await zipper.appendUriList(found);

    const files = [];
    try {
      files.push(await resolveFile(zipper.getBuffer(), zipName));
    } catch (error) {
      if (extension.isDebug) await zipper.writeZip(saveUri.fsPath);
      throw error;
    }

    task.progress.report({ increment: -1, message: t("committing") });

    const res = await extension.api.put<RESTPutApiAppCommitResult>(
      picked.isApp ? Routes.appCommit(picked.id) : Routes.teamCommit(picked.id),
      { files },
    );

    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      if (picked.isApp)
        await extension.appTree.fetch();
      else
        await extension.teamAppTree.fetch();

      if (res.logs) this.logger(picked.app.output ?? picked.id, res.logs);
    }
  }
}
