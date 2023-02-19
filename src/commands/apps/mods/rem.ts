import { t } from "@vscode/l10n";
import { RESTDeleteApiAppTeamResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { TaskData } from "../../../@types";
import AppTreeItem from "../../../structures/AppTreeItem";
import Command from "../../../structures/Command";
import { requester } from "../../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.mod.rem.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickApp(task, true);
      if (!item.appId) return;
    }

    const modID = await this.pickAppMod(item.appId, task);
    if (!modID) return;

    if (!await this.confirmAction()) return;

    const res = await requester<RESTDeleteApiAppTeamResult>(Routes.appTeam(item.appId, modID), {
      method: "DELETE",
    });

    if ("status" in res) {
      this.showApiMessage(res);
    }
  }
}
