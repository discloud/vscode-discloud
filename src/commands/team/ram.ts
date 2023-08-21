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
        title: t("progress.ram.title"),
      },
    });
  }

  async run(task: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    if (!item.appId) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false, startInTeamApps: true });
      item.appId = picked.id;
      if (!item.appId) throw Error(t("missing.appid"));
    }

    let ram;
    do {
      ram = await window.showInputBox({
        value: "100",
        prompt: t("input.ram.prompt"),
        validateInput(value) {
          const n = Number(value);

          if (isNaN(n) || n < 100)
            return t("input.ram.prompt");
        },
      });
    } while (typeof ram === "string" ?
        isNaN(Number(ram)) || Number(ram) < 100 :
        false);

    if (!ram) throw Error("Missing input");

    if (!await this.confirmAction())
      throw Error("Reject action");

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
