import { t } from "@vscode/l10n";
import { GS, resolveFile, RESTPutApiAppCommitResult, Routes } from "discloud.app";
import { join } from "path";
import { FormData } from "undici";
import { ProgressLocation, workspace } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import { requester, Zip } from "../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.commit.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    const workspaceFolder = extension.workspaceFolder;
    if (!workspaceFolder) throw Error("No workspace folder found");

    if (!item.appId) {
      item.appId = await this.pickApp(task, true);
      if (!item.appId) throw Error(t("missing.appid"));
    }

    if (!await this.confirmAction())
      throw Error("Reject action");

    extension.statusBar.setCommitting();

    task.progress.report({ message: `${item.appId} - ${t("choose.files")}` });

    const zipName = `${workspace.name}.zip`;

    const { found } = new GS(workspaceFolder, ".discloudignore",
      extension.workspaceIgnoreList.concat(`${workspaceFolder}/${zipName}`));

    task.progress.report({ message: t("files.zipping") });

    const savePath = join(workspaceFolder, zipName);

    let zipper;
    try {
      zipper = new Zip(savePath);
      zipper.appendFileList(found, workspaceFolder, true);
      await zipper.finalize();
    } catch (error: any) {
      zipper?.destroy();
      extension.emit("error", error);
      throw Error(error);
    }

    const form = new FormData();
    try {
      form.append("file", await resolveFile(savePath, zipName));
    } catch (error: any) {
      zipper.destroy();
      extension.emit("error", error);
      throw Error(error);
    }

    task.progress.report({ message: item.appId });

    const res = await requester<RESTPutApiAppCommitResult>(Routes.appCommit(item.appId), {
      body: form,
      headersTimeout: 420000,
      method: "PUT",
    });

    zipper.destroy();
    extension.resetStatusBar();

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.appTree.getStatus(item.appId);

      if (res.logs) this.logger(item.appId, res.logs);
    }
  }
}