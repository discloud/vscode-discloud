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
        title: t("progress.logs.title"),
      },
    });
  }

  async run(task: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickTeamApp(task, true);
      if (!item.appId) throw Error(t("missing.appid"));
    }

    const res = await requester<RESTGetApiAppLogResult>(Routes.teamLogs(item.appId));
    if (!res.apps) throw Error("No log found");

    this.logger(res.apps.id, res.apps.terminal.big);
  }
}