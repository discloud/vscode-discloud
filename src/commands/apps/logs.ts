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
        cancellable: true,
        title: t("progress.logs.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickApp(task);
      if (!item.appId) return;
    }

    task.progress.report({ message: item.appId });

    const res = await requester<RESTGetApiAppLogResult>(Routes.appLogs(item.appId));
    if (!res.apps) return;

    const output = window.createOutputChannel(res.apps.id, { log: true });

    output.info(res.apps.terminal.big);

    setTimeout(() => output.show(), 100);
  }
}