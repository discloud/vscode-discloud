import { t } from "@vscode/l10n";
import { RESTPutApiAppStartResult, Routes } from "discloud.app";
import { ProgressLocation, window } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import TeamAppTreeItem from "../../structures/TeamAppTreeItem";
import { requester } from "../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.start.title"),
      },
    });
  }

  async run(task: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    if (!item.appId) {
      task.progress.report({ message: t("choose.app") });

      item.appId = await this.pickTeamApp();

      if (!item.appId) return;
    }

    task.progress.report({ message: item.appId });

    const res = await requester<RESTPutApiAppStartResult>(Routes.teamStart(item.appId), {
      method: "PUT",
    });

    if ("status" in res) {
      window.showWarningMessage(`${res.status}: ${res.message}`);

      if (res.status === "ok")
        await extension.teamAppTree.getStatus(item.appId);
    }
  }
}