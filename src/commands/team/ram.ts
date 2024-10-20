import { t } from "@vscode/l10n";
import { type RESTPutApiAppRamResult, Routes } from "discloud.app";
import { ProgressLocation, window } from "vscode";
import { AppType } from "../../@enum";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";
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

    let ramMB;
    do {
      ramMB = await window.showInputBox({
        value: `${item.data.ram ?? min}`,
        prompt: t("input.ram.prompt"),
        validateInput(value) {
          const v = Number(value);

          if (isNaN(v) || v < min) return t("input.ram.prompt");
        },
      });
      if (typeof ramMB === "string") ramMB = parseInt(ramMB);
    } while (typeof ramMB === "number" ? isNaN(ramMB) || ramMB < min : false);

    if (!ramMB) throw Error("Missing input");

    if (!await this.confirmAction()) throw Error("Reject action");

    const res = await requester<RESTPutApiAppRamResult>(Routes.teamRam(item.appId), {
      body: JSON.stringify({ ramMB }),
      method: "PUT",
    });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.teamAppTree.fetch();
    }
  }
}
