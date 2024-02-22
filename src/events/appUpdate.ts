import { t } from "@vscode/l10n";
import { window } from "vscode";
import extension from "../extension";

extension.on("appUpdate", async (oldApp, newApp) => {
  if (!extension.config.get<boolean>("app.notification.status")) return;

  const messageList: string[] = [];

  if (oldApp.online !== newApp.online) {
    messageList.push([
      t("your.app.is.now", {
        app: `${newApp.data.name} (${newApp.appId})`,
      }),
      newApp.online ? "Online" : "Offline",
    ].join(" "));
  }

  if (messageList.length)
    window.showInformationMessage(messageList.join("\n"));
});
