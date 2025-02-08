import { t } from "@vscode/l10n";
import { type RESTPutApiAppStartResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import { requester } from "../../services/discloud";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.stop.title"),
      },
    });
  }

  async run(task: TaskData, item?: TeamAppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false, startInTeamApps: true });
      item = picked.app;
    }

    if (!await this.confirmAction())
      throw Error(t("rejected.action"));

    const res = await requester<RESTPutApiAppStartResult>(Routes.teamStop(item.appId), {
      method: "PUT",
    });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.teamAppTree.fetch();
    }
  }
}
