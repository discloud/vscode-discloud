import { t } from "@vscode/l10n";
import { type RESTPutApiAppCommitResult, Routes, resolveFile } from "discloud.app";
import { ProgressLocation, Uri, workspace } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import { requester } from "../../services/discloud";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import { FileSystem, Zip } from "../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.commit.title"),
      },
    });
  }

  async run(task: TaskData, item?: AppTreeItem) {
    const workspaceFolder = await extension.getWorkspaceFolder();
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    const fileNames = await FileSystem.readSelectedPath(true);

    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    if (!await this.confirmAction())
      throw Error(t("rejected.action"));

    extension.statusBar.setCommitting();

    task.progress.report({ message: `${item.appId} - ${t("choose.files")}` });

    const zipName = `${workspace.name}.zip`;

    const fs = new FileSystem({
      fileNames,
      ignoreFile: ".discloudignore",
      ignoreList: extension.workspaceIgnoreList,
    });

    const found = await fs.findFiles(task.token);
    if (!found.length) throw Error(t("files.missing"));

    task.progress.report({ message: t("files.zipping") });

    const saveUri = Uri.joinPath(workspaceFolder, zipName);

    let zipper;
    try {
      zipper = new Zip(saveUri.fsPath);
      zipper.appendUriList(found);
      await zipper.finalize();
    } catch (error) {
      zipper?.destroy();
      throw error;
    }

    const form = new FormData();
    try {
      form.append("file", await resolveFile(saveUri.fsPath, zipName));
      if (!extension.isDebug) zipper.destroy();
    } catch (error) {
      if (!extension.isDebug) zipper.destroy();
      throw error;
    }

    task.progress.report({ message: item.appId });

    const res = await requester<RESTPutApiAppCommitResult>(Routes.appCommit(item.appId), {
      body: form,
      method: "PUT",
    });

    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.appTree.fetch();

      if (res.logs) this.logger(item.output ?? item.appId, res.logs);
    }
  }
}
