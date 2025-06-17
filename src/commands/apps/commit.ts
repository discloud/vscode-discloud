import { t } from "@vscode/l10n";
import { type RESTPutApiAppCommitResult, Routes, resolveFile } from "discloud.app";
import { CancellationError, ProgressLocation, Uri, workspace } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import FileSystem from "../../util/FileSystem";
import Zip from "../../util/Zip";

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
    const workspaceFolder = await extension.getWorkspaceFolder();
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    if (!await this.confirmAction())
      throw new CancellationError();

    extension.statusBar.setCommitting();

    task.progress.report({ increment: 30, message: `${item.appId} - ${t("choose.files")}` });

    const zipName = `${workspace.name}.zip`;

    const fs = new FileSystem({
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

    task.progress.report({ increment: -1, message: item.appId });

    const response = await extension.api.put<RESTPutApiAppCommitResult>(Routes.appCommit(item.appId), { files });

    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await extension.appTree.fetch();

      if (response.logs) this.logger(item.output ?? item.appId, response.logs);
    }
  }
}
