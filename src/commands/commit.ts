import { t } from "@vscode/l10n";
import { RESTPutApiAppCommitResult, Routes, resolveFile } from "discloud.app";
import { join } from "node:path";
import { FormData } from "undici";
import { ProgressLocation, workspace } from "vscode";
import { TaskData } from "../@types";
import extension from "../extension";
import Command from "../structures/Command";
import { FileSystem, Zip, requester } from "../util";

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
    if (!workspaceFolder) throw Error("No workspace folder found");

    const files = await FileSystem.readSelectedPath(true);

    if (!await this.confirmAction())
      throw Error("Reject action");

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
      zipper.appendUriList(found, true);
      await zipper.finalize();
    } catch (error: any) {
      zipper?.destroy();
      extension.emit("error", error);
      throw Error(error);
    }

    const form = new FormData();
    try {
      form.append("file", await resolveFile(savePath, zipName));
      zipper.destroy();
    } catch (error: any) {
      zipper.destroy();
      extension.emit("error", error);
      throw Error(error);
    }

    task.progress.report({ message: t("committing") });

    const data = await requester<RESTPutApiAppCommitResult>(picked.isApp ?
      Routes.appCommit(picked.id) :
      Routes.teamCommit(picked.id), {
      body: form,
      headersTimeout: 420000,
      method: "PUT",
    });

    extension.resetStatusBar();

    if ("status" in data) {
      this.showApiMessage(data);

      await extension.appTree.getStatus(picked.id);

      if (data.logs) this.logger(picked.id, data.logs);
    }
  }
}
