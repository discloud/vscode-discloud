import { t } from "@vscode/l10n";
import { type RESTPutApiAppStartResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.start.title"),
      },
    });
  }

  async run(_: TaskData, item: TeamAppTreeItem) {
    const response = await this.core.api.put<RESTPutApiAppStartResult>(Routes.teamStart(item.appId));
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await this.core.teamAppTree.fetch();
    }
  }
}
