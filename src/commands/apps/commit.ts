import { t } from "@vscode/l10n";
import { RESTPutApiAppCommitResult, Routes } from "discloud.app";
import { join } from "path";
import { FormData } from "undici";
import { ProgressLocation, workspace } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import { FileSystem, requester, Zip } from "../../util";
import resolveFile from "../../util/resolveFile";

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
    const workspaceFolder = extension.workspaceFolder;
    if (!workspaceFolder) throw Error("No workspace folder found");

    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    if (!await this.confirmAction())
      throw Error("Reject action");

    extension.statusBar.setCommitting();

    task.progress.report({ message: `${item.appId} - ${t("choose.files")}` });

    const zipName = `${workspace.name}.zip`;

    const fs = new FileSystem({
      ignoreFile: ".discloudignore",
      ignoreList: extension.workspaceIgnoreList,
    });

    const found = await fs.findFiles(false);

    task.progress.report({ message: t("files.zipping") });

    const savePath = join(workspaceFolder, zipName);

    let zipper;
    try {
      zipper = new Zip(savePath);
      zipper.appendUriList(found);
      await zipper.finalize();
    } catch (error: any) {
      zipper?.destroy();
      throw Error(error);
    }

    const form = new FormData();
    try {
      form.append("file", await resolveFile(savePath, zipName));
      if (!extension.isDebug) zipper.destroy();
    } catch (error: any) {
      zipper.destroy();
      throw Error(error);
    }

    task.progress.report({ message: item.appId });

    const res = await requester<RESTPutApiAppCommitResult>(Routes.appCommit(item.appId), {
      body: form,
      headersTimeout: 420000,
      method: "PUT",
    });

    extension.resetStatusBar();

    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.appTree.fetch();

      if (res.logs) this.logger(item.appId, res.logs);
    }
  }
}
