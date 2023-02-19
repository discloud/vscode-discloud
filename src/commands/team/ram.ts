import { t } from "@vscode/l10n";
import { RESTPutApiAppRamResult, Routes } from "discloud.app";
import { ProgressLocation, window } from "vscode";
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
        cancellable: true,
        title: t("progress.ram.title"),
      },
    });
  }

  async run(task: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickTeamApp(task, true);
      if (!item.appId) return;
    }

    let ram;
    do {
      ram = await window.showInputBox({
        value: "100",
      });
    } while (typeof ram === "string" ?
        isNaN(Number(ram)) || Number(ram) < 100 :
        false);

    if (!ram) return;

    if (!await this.confirmAction()) return;

    const res = await requester<RESTPutApiAppRamResult>(Routes.teamLogs(item.appId), {
      body: JSON.stringify({
        ramMB: parseInt(ram),
      }),
      method: "PUT",
    });

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.teamAppTree.getStatus(item.appId);
    }
  }
}
