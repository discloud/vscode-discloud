import { t } from "@vscode/l10n";
import { type RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import core from "../../extension";
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

  async run(_: TaskData, item: TeamAppTreeItem) {
    const response = await core.api.get<RESTGetApiAppLogResult>(Routes.teamLogs(item.appId));
    if (!response) return;

    if (!response.apps || !response.apps.terminal.big) throw Error(t("no.log.found"));

    this.logger(item.output ?? response.apps.id, response.apps.terminal.big);
  }
}
