import { t } from "@vscode/l10n";
import { type RESTPutApiAppRamResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { AppType } from "../../@enum";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";
import InputBox from "../../util/Input";

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

    const ramMB = await InputBox.getInt({
      denyInitial: typeof item.data.ram === "number" && item.data.ram >= min,
      initial: item.data.ram,
      min,
      prompt: t("input.ram.prompt"),
      required: true,
    });

    if (!await this.confirmAction())
      throw Error(t("rejected.action"));

    const res = await extension.api.put<RESTPutApiAppRamResult>(Routes.teamRam(item.appId), { body: { ramMB } });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.teamAppTree.fetch();
    }
  }
}
