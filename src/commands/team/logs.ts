import { type RESTGetApiAppLogResult, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.logs.title"),
      },
    });
  }

  async run(_: TaskData, item: TeamAppTreeItem) {
    const response = await this.core.api.get<RESTGetApiAppLogResult>(Routes.teamLogs(item.appId));
    if (!response) return;

    if (!response.apps || !response.apps.terminal.big) throw Error(t("no.log.found"));

    this.logger(item.output ?? response.apps.id, response.apps.terminal.big);
  }
}
