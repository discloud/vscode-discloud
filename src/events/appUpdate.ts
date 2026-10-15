import { t } from "@vscode/l10n";
import { window } from "vscode";
import type ExtensionCore from "../core";
import type UserAppTreeItem from "../structures/UserAppTreeItem";
import { ConfigKeys } from "../utils/constants";

export default async function (core: ExtensionCore, oldApp: UserAppTreeItem, newApp: UserAppTreeItem) {
  if (!core.config.get<boolean>(ConfigKeys.appNotificationStatus)) return;

  const messageList: string[] = [];

  if (oldApp.online !== newApp.online) {
    messageList.push([
      t("your.app.is.now", {
        app: `${newApp.data.name} (${newApp.appId})`,
      }),
      t(newApp.online ? "online" : "offline"),
    ].join(" "));
  }

  if (messageList.length)
    void window.showInformationMessage(messageList.join("\n"));
}
