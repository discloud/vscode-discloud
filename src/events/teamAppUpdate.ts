import { t } from "@vscode/l10n";
import { window } from "vscode";
import type ExtensionCore from "../core/extension";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";
import { ConfigKeys } from "../utils/constants";

export default async function (core: ExtensionCore, oldApp: TeamAppTreeItem, newApp: TeamAppTreeItem) {
  if (!core.config.get<boolean>(ConfigKeys.teamAppNotificationStatus)) return;

  const messageList: string[] = [];

  if (oldApp.online !== newApp.online) {
    messageList.push([
      t("your.team.app.is.now", {
        app: `${newApp.data.name} (${newApp.appId})`,
      }),
      newApp.online ? "Online" : "Offline",
    ].join(" "));
  }

  if (messageList.length)
    void window.showInformationMessage(messageList.join("\n"));
}
