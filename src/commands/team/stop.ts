import { t } from "@vscode/l10n";
import { RESTPutApiAppStartResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import Command from "../../structures/Command";
import TeamAppTreeItem from "../../structures/TeamAppTreeItem";
import { requester } from "../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.stop.title"),
      },
    });
  }

  async run(task: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickTeamApp(task, true);
      if (!item.appId) return;
    }

    if (!await this.confirmAction()) return;

    const res = await requester<RESTPutApiAppStartResult>(Routes.teamStop(item.appId), {
      method: "PUT",
    });

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.teamAppTree.getStatus(item.appId);
    }
  }
}