import { t } from "@vscode/l10n";
import { type RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import { requester } from "../../services/discloud";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.logs.title"),
      },
    });
  }

  async run(task: TaskData, item?: TeamAppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false, startInTeamApps: true });
      item = picked.app;
    }

    const res = await requester<RESTGetApiAppLogResult>(Routes.teamLogs(item.appId));
    if (!res) return;

    if (!res.apps || !res.apps.terminal.big) {
      throw Error(t("no.log.found"));
    }

    this.logger(item.output ?? res.apps.id, res.apps.terminal.big);
  }
}
