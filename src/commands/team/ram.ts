import { t } from "@vscode/l10n";
import { RESTPutApiAppRamResult, Routes } from "discloud.app";
import { ProgressLocation, window } from "vscode";
import { AppType } from "../../@enum";
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

  async run(task: TaskData, item?: TeamAppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false, startInTeamApps: true });
      item = picked.app;
    }

    const min = item.type === AppType.site ? 512 : 100;

    let ram;
    do {
      ram = await window.showInputBox({
        value: `${item.data.ram ?? min}`,
        prompt: t("input.ram.prompt"),
        validateInput(value) {
          const n = Number(value);

          if (isNaN(n) || n < min)
            return t("input.ram.prompt");
        },
      });
    } while (typeof ram === "string" ?
        isNaN(Number(ram)) || Number(ram) < min :
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
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.teamAppTree.fetch();
    }
  }
}
