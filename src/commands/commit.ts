import { t } from "@vscode/l10n";
import { type RESTPutApiAppCommitResult, Routes, resolveFile } from "discloud.app";
import { ProgressLocation, Uri, workspace } from "vscode";
import { type TaskData } from "../@types";
import extension from "../extension";
import { requester } from "../services/discloud";
import Command from "../structures/Command";
import { FileSystem, Zip } from "../util";

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
    const workspaceFolder = extension.workspaceFolderUri;
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    const fileNames = await FileSystem.readSelectedPath(true);

    if (!await this.confirmAction())
      throw Error(t("rejected.action"));

    extension.statusBar.setCommitting();

    const picked = await this.pickAppOrTeamApp(task, { showOther: true });
    if (!picked.id) throw Error(t("missing.appid"));

    task.progress.report({ message: t("files.checking") });

    const zipName = `${workspace.name}.zip`;

    const fs = new FileSystem({
      fileNames,
      ignoreFile: ".discloudignore",
      ignoreList: extension.workspaceIgnoreList,
    });

    const found = await fs.findFiles(task.token);
    if (!found.length) throw Error(t("files.missing"));

    const saveUri = Uri.joinPath(workspaceFolder, zipName);

    task.progress.report({ message: t("files.zipping") });

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

    task.progress.report({ message: t("committing") });

    const res = await requester<RESTPutApiAppCommitResult>(picked.isApp ?
      Routes.appCommit(picked.id) :
      Routes.teamCommit(picked.id), {
      body: form,
      method: "PUT",
    });

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
