import { t } from "@vscode/l10n";
import { window } from "vscode";
import extension from "../extension";

extension.on("teamAppUpdate", async (oldApp, newApp) => {
  if (!extension.config.get<boolean>("team.app.notification.status")) return;

  const messageList: string[] = [];

  if (oldApp.isOnline !== newApp.isOnline) {
    messageList.push([
      t("your.team.app.is.now", {
        app: `${newApp.data.name} (${newApp.appId})`,
      }),
      newApp.isOnline ? "Online" : "Offline",
    ].join(" "));
  }

  if (messageList.length)
    window.showInformationMessage(messageList.join("\n"));
});
