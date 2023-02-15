import { t } from "@vscode/l10n";
import { IgnoreFiles, resolveFile, RESTPutApiAppCommitResult, Routes } from "discloud.app";
import { existsSync, statSync } from "fs";
import { join } from "node:path";
import { FormData } from "undici";
import { ProgressLocation, window, workspace } from "vscode";
import { TaskData } from "../@types";
import extension from "../extension";
import Command from "../structures/Command";
import { GS, requester, Zip } from "../util";

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

  async run(task: TaskData) {
    if (!extension.workspaceFolder) return;
    const workspaceFolder = extension.workspaceFolder;

    const paths = await extension.copyFilePath();

    if (!await this.confirmAction()) return;

    extension.statusBar.setCommiting();

    task.progress.report({ message: t("choose.app") });

    const appId = await this.pickApp();

    if (!appId) return;

    task.progress.report({
      message: t("files.checking"),
      increment: 10,
    });

    const { list } = new IgnoreFiles({
      fileName: ".discloudignore",
      path: workspaceFolder,
      optionalIgnoreList: [`${workspaceFolder}/discloud/**`],
    });

    let files = [];
    for (const path of paths) {
      if (existsSync(path))
        if (statSync(path).isFile()) {
          files.push(path);
        } else {
          const { found } = new GS(path, "", list);
          files.push(found);
        }
    }
    files = [...new Set(files.flat())];

    task.progress.report({
      message: t("file.zipping"),
      increment: 20,
    });

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

    task.progress.report({
      message: t("commiting"),
      increment: 30,
    });

    const data = await requester<RESTPutApiAppCommitResult>(Routes.appCommit(appId), {
      body: form,
      headersTimeout: 420000,
      method: "PUT",
    });

    task.progress.report({ increment: 100 });
    zipper.destroy();
    extension.resetStatusBar();

    if ("status" in data) {
      if (data.status === "ok") {
        window.showInformationMessage(`${data.status}: ${data.message} - ID: ${appId}`);

        await extension.appTree.getStatus(appId);
      } else {
        window.showWarningMessage(`${data.status}${data.statusCode ? ` ${data.statusCode}` : ""}: ${data?.message}`);
      }

      if (data.logs) {
        const output = window.createOutputChannel(appId, { log: true });

        output.info(data.logs);

        setTimeout(() => output.show(), 100);
      }
    }
  }
}