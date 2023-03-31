import { t } from "@vscode/l10n";
import { RESTDeleteApiAppDeleteResult, Routes } from "discloud.app";
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
        title: t("progress.delete.title"),
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

    const res = await requester<RESTDeleteApiAppDeleteResult>(Routes.appDelete(item.appId), {
      method: "DELETE",
    });

    if ("status" in res) {
      this.showApiMessage(res);

      if (res.status === "ok") {
        extension.appTree.delete(item.appId);
      }
    }
  }
}
