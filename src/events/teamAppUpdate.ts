import { t } from "@vscode/l10n";
import { window } from "vscode";
import extension from "../extension";

extension.on("teamAppUpdate", (oldApp, newApp) => {
  if (!extension.config.get<boolean>("team.app.notification.status")) return;

  const messageList: string[] = [];

  if (oldApp.data.container !== newApp.data.container) {
    messageList.push([
      t("your.team.app.is.now", {
        app: `${newApp.data.name} (${newApp.appId})`,
      }),
      newApp.data.container,
    ].join(" "));
  }

  if (messageList.length)
    window.showInformationMessage(messageList.join("\n"));
});
