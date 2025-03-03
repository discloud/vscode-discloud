import { t } from "@vscode/l10n";
import { type RESTPutApiAppStartResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.start.title"),
      },
    });
  }

  async run(task: TaskData, item?: TeamAppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false, startInTeamApps: true });
      item = picked.app;
    }

    const res = await extension.rest.put<RESTPutApiAppStartResult>(Routes.teamStart(item.appId));
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.teamAppTree.fetch();
    }
  }
}
