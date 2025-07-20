import { type RESTPutApiAppRestartResult, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type UserAppTreeItem from "../../structures/UserAppTreeItem";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.restart.title"),
      },
    });
  }

  async run(_: TaskData, item: UserAppTreeItem) {
    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await this.core.api.put<RESTPutApiAppRestartResult>(Routes.appRestart(item.appId));
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await this.core.userAppTree.fetch();
    }
  }
}
