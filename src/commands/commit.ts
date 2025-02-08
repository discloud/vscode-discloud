import { t } from "@vscode/l10n";
import { type RESTPutApiAppCommitResult, Routes, resolveFile } from "discloud.app";
import { join } from "path";
import { ProgressLocation, workspace } from "vscode";
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
    const workspaceFolder = extension.workspaceFolder;
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    const files = await FileSystem.readSelectedPath(true);

    if (!await this.confirmAction())
      throw Error(t("rejected.action"));

    extension.statusBar.setCommitting();

    const picked = await this.pickAppOrTeamApp(task, { showOther: true });
    if (!picked.id) throw Error(t("missing.appid"));

    task.progress.report({ message: t("files.checking") });

    const zipName = `${workspace.name}.zip`;

    const fs = new FileSystem({
      fileNames: files,
      ignoreFile: ".discloudignore",
      ignoreList: extension.workspaceIgnoreList,
    });

    const found = await fs.findFiles();

    const savePath = join(workspaceFolder, zipName);

    task.progress.report({ message: t("files.zipping") });

    let zipper;
    try {
      zipper = new Zip(savePath);
      zipper.appendUriList(found);
      await zipper.finalize();
    } catch (error: any) {
      zipper?.destroy();
      throw error;
    }

    const form = new FormData();
    try {
      form.append("file", await resolveFile(savePath, zipName));
      if (!extension.isDebug) zipper.destroy();
    } catch (error: any) {
      zipper.destroy();
      throw error;
    }

    task.progress.report({ message: t("committing") });

    const res = await requester<RESTPutApiAppCommitResult>(picked.isApp ?
      Routes.appCommit(picked.id) :
      Routes.teamCommit(picked.id), {
      body: form,
      method: "PUT",
    });

    extension.resetStatusBar();

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
