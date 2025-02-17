import { t } from "@vscode/l10n";
import { DiscloudConfig, type RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../@types";
import extension from "../extension";
import { requester } from "../services/discloud";
import Command from "../structures/Command";

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
      const workspaceFolder = await extension.getWorkspaceFolder();
      if (workspaceFolder) {
        const dConfig = new DiscloudConfig(workspaceFolder.fsPath);

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

    if (!res.apps || !res.apps.terminal.big)
      throw Error(t("no.log.found"));

    this.logger(item.output ?? res.apps.id, res.apps.terminal.big);
  }
}
