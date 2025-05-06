import { t } from "@vscode/l10n";
import { type RESTDeleteApiAppTeamResult, Routes } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../../@types";
import extension from "../../../extension";
import type AppTreeItem from "../../../structures/AppTreeItem";
import Command from "../../../structures/Command";

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
    if (!mod) throw Error(t("missing.moderator"));

    if (!await this.confirmAction())
      throw new CancellationError();

    const res = await extension.api.delete<RESTDeleteApiAppTeamResult>(Routes.appTeam(item.appId, mod.id));
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);
    }
  }
}
