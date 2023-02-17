import { t } from "@vscode/l10n";
import { resolveFile, RESTPutApiAppCommitResult, Routes } from "discloud.app";
import { join } from "path";
import { FormData } from "undici";
import { ProgressLocation, window, workspace } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import Command from "../../structures/Command";
import TeamAppTreeItem from "../../structures/TeamAppTreeItem";
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

  async run(task: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    if (!extension.workspaceFolder) return;
    const workspaceFolder = extension.workspaceFolder;

    if (!item.appId) {
      item.appId = await this.pickTeamApp(task);
      if (!item.appId) return;
    }

    if (!await this.confirmAction()) return;

    task.progress.report({ message: `${item.appId} - ${t("choose.files")}` });

    const { found } = new GS(workspaceFolder, "\\.discloudignore", [`${workspaceFolder}/discloud/**`]);

    task.progress.report({
      message: t("files.zipping"),
      increment: 20,
    });

    const zipName = `${workspace.name}.zip`;
    const savePath = join(workspaceFolder, zipName);

    let zipper;
    try {
      zipper = new Zip(savePath);
      zipper.appendFileList(found, workspaceFolder);
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

    const res = await requester<RESTPutApiAppCommitResult>(Routes.teamCommit(item.appId), {
      body: form,
      headersTimeout: 420000,
      method: "PUT",
    });

    task.progress.report({ increment: 100 });
    zipper.destroy();
    extension.resetStatusBar();

    if ("status" in res) {
      if (res.status === "ok") {
        window.showInformationMessage(`${res.status}: ${res.message} - ID: ${item.appId}`);

        await extension.teamAppTree.getStatus(item.appId);
      } else {
        window.showWarningMessage(`${res.status}${res.statusCode ? ` ${res.statusCode}` : ""}: ${res?.message}`);
      }

      if (res.logs) {
        const output = window.createOutputChannel(item.appId, { log: true });

        output.info(res.logs);

        setTimeout(() => output.show(), 100);
      }
    }
  }
}