import { t } from "@vscode/l10n";
import { type RESTPutApiAppStartResult, Routes } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
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

  async run(_: TaskData, item: TeamAppTreeItem) {
    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await extension.api.put<RESTPutApiAppStartResult>(Routes.teamStop(item.appId));
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await extension.teamAppTree.fetch();
    }
  }
}
