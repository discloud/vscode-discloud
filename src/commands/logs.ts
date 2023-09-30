import { t } from "@vscode/l10n";
import { DiscloudConfig, RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation, window } from "vscode";
import { TaskData } from "../@types";
import extension from "../extension";
import Command from "../structures/Command";
import { requester } from "../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.logs.title"),
      },
    });
  }

  async run(task: TaskData, item: Record<string, any> = {}) {
    if (!item?.appId) {
      if (extension.workspaceFolder) {
        const dConfig = new DiscloudConfig(extension.workspaceFolder);

        if (dConfig.data.ID) {
          if (extension.appTree.children.has(dConfig.data.ID)) {
            item.isApp = true;
            item.appId = dConfig.data.ID;
          }

          if (extension.teamAppTree.children.has(dConfig.data.ID)) {
            item.isApp = false;
            item.appId = dConfig.data.ID;
          }
        }

        if (!item.appId) throw Error(t("missing.appid"));
      } else {
        const picked = await this.pickAppOrTeamApp(task);
        item.appId = picked.id;
        item.isApp = picked.isApp;
      }
    }

    const res = await requester<RESTGetApiAppLogResult>(item.isApp ?
      Routes.appLogs(item.appId) :
      Routes.teamLogs(item.appId));
    if (!res) return;

    if (!res.apps || !res.apps.terminal.big) {
      return window.showErrorMessage(t("log404"));
    };

    this.logger(item.output ?? res.apps.id, res.apps.terminal.big);
  }
}
