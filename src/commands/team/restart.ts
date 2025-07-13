import { t } from "@vscode/l10n";
import { type RESTPutApiAppRestartResult, Routes } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import core from "../../extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.restart.title"),
      },
    });
  }

  async run(_: TaskData, item: TeamAppTreeItem) {
    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await core.api.put<RESTPutApiAppRestartResult>(Routes.teamRestart(item.appId));
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await core.teamAppTree.fetch();
    }
  }
}
