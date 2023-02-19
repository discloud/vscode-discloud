import { t } from "@vscode/l10n";
import { RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { TaskData } from "../../@types";
import Command from "../../structures/Command";
import TeamAppTreeItem from "../../structures/TeamAppTreeItem";
import { requester } from "../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.logs.title"),
      },
    });
  }

  async run(task: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickTeamApp(task, true);
      if (!item.appId) return;
    }

    const res = await requester<RESTGetApiAppLogResult>(Routes.teamLogs(item.appId));
    if (!res.apps) return;

    this.logger(res.apps.id, res.apps.terminal.big);
  }
}