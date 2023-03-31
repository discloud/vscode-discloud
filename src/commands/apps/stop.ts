import { t } from "@vscode/l10n";
import { RESTPutApiAppStartResult, Routes } from "discloud.app";
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
        title: t("progress.stop.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickApp(task, true);
      if (!item.appId) throw Error(t("missing.appid"));
    }

    if (!await this.confirmAction())
      throw Error("Reject action");

    const res = await requester<RESTPutApiAppStartResult>(Routes.appStop(item.appId), {
      method: "PUT",
    });

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.appTree.getStatus(item.appId);
    }
  }
}
