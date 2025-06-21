import { t } from "@vscode/l10n";
import { DiscloudConfig, DiscloudConfigScopes, type RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../@types";
import extension from "../extension";
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
        const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

        const ID = dConfig.get(DiscloudConfigScopes.ID);

        if (ID) {
          if (extension.appTree.children.has(ID)) {
            item.isApp = true;
            item.appId = ID;
          }

          if (extension.teamAppTree.children.has(ID)) {
            item.isApp = false;
            item.appId = ID;
          }
        }

        if (!item.appId) throw Error(t("missing.appid"));
      } else {
        const picked = await this.pickAppOrTeamApp(task);
        item.appId = picked.id;
        item.isApp = picked.isApp;
      }
    }

    const response = await extension.api.get<RESTGetApiAppLogResult>(item.isApp
      ? Routes.appLogs(item.appId)
      : Routes.teamLogs(item.appId));

    if (!response) return;

    if (!response.apps || !response.apps.terminal.big)
      throw Error(t("no.log.found"));

    this.logger(item.output ?? response.apps.id, response.apps.terminal.big);
  }
}
