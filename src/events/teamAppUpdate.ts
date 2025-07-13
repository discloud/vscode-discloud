import { t } from "@vscode/l10n";
import { window } from "vscode";
import core from "../extension";
import { ConfigKeys } from "../utils/constants";

core.on("teamAppUpdate", async function (oldApp, newApp) {
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
    await window.showInformationMessage(messageList.join("\n"));
});
