import { t } from "@vscode/l10n";
import { RESTDeleteApiAppDeleteResult, Routes } from "discloud.app";
import { ProgressLocation, window } from "vscode";
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
        title: t("progress.delete.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      task.progress.report({ message: t("choose.app") });

      item.appId = await this.pickApp();

      if (!item.appId) return;
    }

    task.progress.report({ message: item.appId });

    if (!await this.confirmAction()) return;

    const res = await requester<RESTDeleteApiAppDeleteResult>(Routes.appDelete(item.appId), {
      method: "DELETE",
    });

    if ("status" in res) {
      window.showWarningMessage(`${res.status}: ${res.message}`);

      if (res.status === "ok") {
        extension.appTree.delete(item.appId);
      }
    }
  }
}