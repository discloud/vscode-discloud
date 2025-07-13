import { t } from "@vscode/l10n";
import { DiscloudConfig, DiscloudConfigScopes, type RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../@types";
import core from "../extension";
import AppTreeItem from "../structures/AppTreeItem";
import Command from "../structures/Command";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";
import { pickApp } from "../util/apps";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.logs.title"),
      },
    });
  }

  async run(task: TaskData, item?: AppTreeItem | TeamAppTreeItem) {
    if (!item) {
      const workspaceFolder = await core.getWorkspaceFolder({ fallbackUserChoice: false });
      if (workspaceFolder) {
        const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

        const ID = dConfig.get(DiscloudConfigScopes.ID);

        if (ID) item = core.appTree.children.get(ID) ?? core.teamAppTree.children.get(ID)!;

        if (!item) throw Error(t("missing.appid"));
      } else {
        item = await pickApp({
          noCached: true,
          throwOnCancel: true,
          token: task.token,
        });
      }
    }

    const response = await core.api.get<RESTGetApiAppLogResult>(
      item instanceof AppTreeItem
        ? Routes.appLogs(item.appId)
        : Routes.teamLogs(item.appId),
    );

    if (!response) return;

    if (!response.apps || !response.apps.terminal.big)
      throw Error(t("no.log.found"));

    this.logger(item.output ?? response.apps.id, response.apps.terminal.big);
  }
}
