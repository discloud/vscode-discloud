import { t } from "@vscode/l10n";
import { type RESTDeleteApiAppDeleteResult, Routes } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.delete.title"),
      },
    });
  }

  async run(_: TaskData, item: AppTreeItem) {
    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await extension.api.delete<RESTDeleteApiAppDeleteResult>(Routes.appDelete(item.appId));
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      if (response.status === "ok") {
        extension.appTree.delete(item.appId);
      }
    }
  }
}
