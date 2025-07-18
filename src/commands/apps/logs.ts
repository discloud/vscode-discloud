import { t } from "@vscode/l10n";
import { type RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.logs.title"),
      },
    });
  }

  async run(_: TaskData, item: AppTreeItem) {
    const response = await this.core.api.get<RESTGetApiAppLogResult>(Routes.appLogs(item.appId));
    if (!response) return;

    if (!response.apps || !response.apps.terminal.big) throw Error(t("no.log.found"));

    this.logger(item.output ?? response.apps.id, response.apps.terminal.big);
  }
}
