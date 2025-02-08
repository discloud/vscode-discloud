import { t } from "@vscode/l10n";
import { type RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import { requester } from "../../services/discloud";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.logs.title"),
      },
    });
  }

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const res = await requester<RESTGetApiAppLogResult>(Routes.appLogs(item.appId));
    if (!res) return;

    if (!res.apps || !res.apps.terminal.big) throw Error(t("log404"));

    this.logger(item.output ?? res.apps.id, res.apps.terminal.big);
  }
}
