import { t } from "@vscode/l10n";
import { RESTPutApiAppRamResult, Routes } from "discloud.app";
import { ProgressLocation, window } from "vscode";
import { AppType } from "../../@enum";
import { TaskData } from "../../@types";
import extension from "../../extension";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
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

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const min = item.type === AppType.site ? 512 : 100;
    const max = extension.user.totalRamMb - extension.user.ramUsedMb - item.data.ram;

    let ram;
    do {
      ram = await window.showInputBox({
        value: `${item.data.ram}`,
        prompt: t("input.ram.prompt"),
        validateInput(value) {
          const n = Number(value);

          if (isNaN(n) || n < min || n > max)
            return t("input.ram.prompt");
        },
      });
    } while (typeof ram === "string" ?
        isNaN(Number(ram)) || Number(ram) < min || Number(ram) > max :
        false);

    if (!ram) throw Error("Missing input");

    if (!await this.confirmAction())
      throw Error("Reject action");

    const res = await requester<RESTPutApiAppRamResult>(Routes.appRam(item.appId), {
      body: JSON.stringify({
        ramMB: parseInt(ram),
      }),
      method: "PUT",
    });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.appTree.fetch();
    }
  }
}
