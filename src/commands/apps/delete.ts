import { type RESTDeleteApiAppDeleteResult, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type UserAppTreeItem from "../../structures/UserAppTreeItem";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.delete.title"),
      },
    });
  }

  async run(_: TaskData, item: UserAppTreeItem) {
    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await this.core.api.delete<RESTDeleteApiAppDeleteResult>(Routes.appDelete(item.appId));
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      if (response.status === "ok") {
        this.core.userAppTree.delete(item.appId);

        await this.core.userAppTree.fetch();
      }
    }
  }
}
