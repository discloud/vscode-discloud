import { t } from "@vscode/l10n";
import { type RESTPutApiAppRamResult, Routes } from "discloud.app";
import { ProgressLocation, window } from "vscode";
import { AppType } from "../../@enum";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import { requester } from "../../services/discloud";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.ram.title"),
      },
    });
  }

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const min = item.type === AppType.site ? 512 : 100;
    const max = extension.user.totalRamMb - extension.user.ramUsedMb;

    let ramMB;
    do {
      ramMB = await window.showInputBox({
        value: `${item.data.ram}`,
        title: `${min} - ${max}`,
        prompt: t("input.ram.prompt"),
        validateInput(value) {
          const v = Number(value);

          if (isNaN(v) || v === item.data.ram || v < min || v > max) return t("input.ram.prompt");
        },
      });
      if (typeof ramMB === "string") ramMB = parseInt(ramMB);
    } while (typeof ramMB === "number" ? isNaN(ramMB) || ramMB < min || ramMB > max : false);

    if (!ramMB) throw Error("Missing input");

    if (!await this.confirmAction()) throw Error("Reject action");

    const res = await requester<RESTPutApiAppRamResult>(Routes.appRam(item.appId), {
      body: JSON.stringify({ ramMB }),
      method: "PUT",
    });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.appTree.fetch();
    }
  }
}
