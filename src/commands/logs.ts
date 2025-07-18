import { t } from "@vscode/l10n";
import { DiscloudConfig, DiscloudConfigScopes, type RESTGetApiAppLogResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../@types";
import type ExtensionCore from "../core/extension";
import Command from "../structures/Command";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";
import UserAppTreeItem from "../structures/UserAppTreeItem";
import { pickApp } from "../utils/apps";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.logs.title"),
      },
    });
  }

  async run(task: TaskData, item?: UserAppTreeItem | TeamAppTreeItem) {
    if (!item) {
      const workspaceFolder = await this.core.getWorkspaceFolder({ fallbackUserChoice: false });
      if (workspaceFolder) {
        const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

        const ID = dConfig.get(DiscloudConfigScopes.ID);

        if (ID) item = this.core.userAppTree.children.get(ID) ?? this.core.teamAppTree.children.get(ID)!;

        if (!item) throw Error(t("missing.appid"));
      } else {
        item = await pickApp({
          noCached: true,
          throwOnCancel: true,
          token: task.token,
        });
      }
    }

    const response = await this.core.api.get<RESTGetApiAppLogResult>(
      item instanceof UserAppTreeItem
        ? Routes.appLogs(item.appId)
        : Routes.teamLogs(item.appId),
    );

    if (!response) return;

    if (!response.apps || !response.apps.terminal.big)
      throw Error(t("no.log.found"));

    this.logger(item.output ?? response.apps.id, response.apps.terminal.big);
  }
}
