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
        title: t("progress.mod.rem.title"),
      },
    });
  }

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const mod = await this.pickAppMod(item.appId, task);
    if (!mod) throw Error("Missing mod");

    if (!await this.confirmAction())
      throw Error("Reject action");

    const res = await requester<RESTDeleteApiAppTeamResult>(Routes.appTeam(item.appId, mod.id), {
      method: "DELETE",
    });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);
    }
  }
}
