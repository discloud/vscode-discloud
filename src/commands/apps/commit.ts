import { t } from "@vscode/l10n";
import { IgnoreFiles, resolveFile, RESTPutApiAppCommitResult, Routes } from "discloud.app";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { FormData } from "undici";
import { ProgressLocation, window, workspace } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import { GS, requester, Zip } from "../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.commit.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!extension.workspaceFolder) return;
    const workspaceFolder = extension.workspaceFolder;

    if (!item.appId) {
      task.progress.report({ message: t("choose.app") });

      item.appId = await this.pickApp();

      if (!item.appId) return;
    }

    task.progress.report({ message: `${item.appId} - ${t("choose.files")}` });

    const paths = await window.showOpenDialog({
      canSelectMany: true,
    });
    if (!paths?.length) return;

    const { list } = new IgnoreFiles({
      fileName: ".discloudignore",
      path: workspaceFolder,
    });

    let files = [];
    for (const path of paths) {
      if (existsSync(path.fsPath))
        if (statSync(path.fsPath).isFile()) {
          files.push(path.fsPath);
        } else {
          const { found } = new GS(path.fsPath, "", list);
          files.push(found);
        }
    }
    files = [...new Set(files.flat())];

    task.progress.report({ message: t("files.zipping") });

    const zipName = `${workspace.name}.zip`;
    const savePath = join(workspaceFolder, zipName);

    let zipper;
    try {
      zipper = new Zip(savePath);
      zipper.appendFileList(files, workspaceFolder);
      await zipper.finalize();
    } catch (error: any) {
      zipper?.destroy();
      extension.resetStatusBar();
      window.showErrorMessage(error);
      return;
    }

    const form = new FormData();
    try {
      form.append("file", await resolveFile(savePath, zipName));
    } catch (error: any) {
      zipper.destroy();
      extension.resetStatusBar();
      window.showErrorMessage(error);
      return;
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
      if (res.status === "ok") {
        window.showInformationMessage(`${res.status}: ${res.message} - ID: ${item.appId}`);

        await extension.appTree.getStatus(item.appId);
      } else {
        window.showWarningMessage(`${res.status}${res.statusCode ? ` ${res.statusCode}` : ""}: ${res?.message}`);
      }
    }
  }
}