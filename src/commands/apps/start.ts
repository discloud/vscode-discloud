import { t } from "@vscode/l10n";
import { type RESTPutApiAppStartResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import core from "../../extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.start.title"),
      },
    });
  }

  async run(_: TaskData, item: AppTreeItem) {
    const response = await core.api.put<RESTPutApiAppStartResult>(Routes.appStart(item.appId));
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await core.appTree.fetch();
    }
  }
}
