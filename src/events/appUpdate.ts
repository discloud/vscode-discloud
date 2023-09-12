import { t } from "@vscode/l10n";
import { window } from "vscode";
import extension from "../extension";

extension.on("appUpdate", async (oldApp, newApp) => {
  if (!extension.config.get<boolean>("app.notification.status")) return;

  const messageList: string[] = [];

  if (oldApp.data.container !== newApp.data.container) {
    messageList.push([
      t("your.app.is.now", {
        app: `${newApp.data.name} (${newApp.appId})`,
      }),
      newApp.data.container,
    ].join(" "));
  }

  if (messageList.length)
    window.showInformationMessage(messageList.join("\n"));
});
