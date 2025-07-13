import { t } from "@vscode/l10n";
import { window } from "vscode";
import core from "../extension";
import { ConfigKeys } from "../util/constants";

core.on("appUpdate", async function (oldApp, newApp) {
  if (!core.config.get<boolean>(ConfigKeys.appNotificationStatus)) return;

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
    await window.showInformationMessage(messageList.join("\n"));
});
