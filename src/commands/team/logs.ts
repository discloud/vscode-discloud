import { t } from "@vscode/l10n";
import { RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation, window } from "vscode";
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
      task.progress.report({ message: t("choose.app") });

      item.appId = await this.pickTeamApp();

      if (!item.appId) return;
    }

    task.progress.report({ message: item.appId });

    const res = await requester<RESTGetApiAppLogResult>(Routes.teamLogs(item.appId));
    if (!res.apps) return;

    const output = window.createOutputChannel(res.apps.id);

    output.append(res.apps.terminal.big);

    output.show();
  }
}