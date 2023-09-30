import { t } from "@vscode/l10n";
import { RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation, window } from "vscode";
import { TaskData } from "../../@types";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
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

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const res = await requester<RESTGetApiAppLogResult>(Routes.appLogs(item.appId));
    if (!res) return;

    if (!res.apps || !res.apps.terminal.big) {
      return window.showErrorMessage(t("log404"));
    };

    this.logger(item.output ?? res.apps.id, res.apps.terminal.big);
  }
}
