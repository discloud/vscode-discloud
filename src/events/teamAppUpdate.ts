import { t } from "@vscode/l10n";
import { window } from "vscode";
import extension from "../extension";

extension.on("teamAppUpdate", async (oldApp, newApp) => {
  if (!extension.config.get<boolean>("team.app.notification.status")) return;

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
    window.showInformationMessage(messageList.join("\n"));
});
