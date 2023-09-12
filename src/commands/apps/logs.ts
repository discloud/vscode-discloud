import { RESTGetApiAppLogResult, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
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

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item.appId = picked.id;
      if (!item.appId) throw Error(t("missing.appid"));
    }

    const res = await requester<RESTGetApiAppLogResult>(Routes.appLogs(item.appId));
    if (!res.apps || !res.apps.terminal.big) {
      return window.showErrorMessage(t("log404"));
    };

    this.logger(res.apps.id, res.apps.terminal.big);
  }
}
