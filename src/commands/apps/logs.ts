import { t } from "@vscode/l10n";
import { RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
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

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickApp(task, true);
      if (!item.appId) throw Error(t("missing.appid"));
    }

    const res = await requester<RESTGetApiAppLogResult>(Routes.appLogs(item.appId));
    if (!res.apps || !res.apps.terminal.big) throw Error(t("log404"));

    this.logger(res.apps.id, res.apps.terminal.big);
  }
}
