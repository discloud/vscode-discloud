import { type RESTPutApiAppStartResult, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.stop.title"),
      },
    });
  }

  async run(_: TaskData, item: TeamAppTreeItem) {
    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await this.core.api.put<RESTPutApiAppStartResult>(Routes.teamStop(item.appId));
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await this.core.teamAppTree.fetch();
    }
  }
}
