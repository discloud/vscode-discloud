import { t } from "@vscode/l10n";
import { type RESTPutApiAppStartResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import core from "../../extension";
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

  async run(_: TaskData, item: TeamAppTreeItem) {
    const response = await core.api.put<RESTPutApiAppStartResult>(Routes.teamStart(item.appId));
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await core.teamAppTree.fetch();
    }
  }
}
