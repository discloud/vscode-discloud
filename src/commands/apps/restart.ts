import { t } from "@vscode/l10n";
import { RESTPutApiAppRestartResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import { requester } from "../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.restart.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickApp(task, true);
      if (!item.appId) return;
    }

    if (!await this.confirmAction()) return;

    const res = await requester<RESTPutApiAppRestartResult>(Routes.appRestart(item.appId), {
      method: "PUT",
    });

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.appTree.getStatus(item.appId);
    }
  }
}