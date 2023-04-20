import { t } from "@vscode/l10n";
import { window } from "vscode";
import extension from "../extension";

let timer: NodeJS.Timer;

extension.on("rateLimited", (rateLimitData) => {
  clearTimeout(timer);

  extension.logger.warn("Rate limited by " + rateLimitData.time + " seconds");

  window.showInformationMessage(t("ratelimited", {
    s: Math.floor(rateLimitData.time),
  }));

  extension.statusBar.setRateLimited(true);

  timer = setTimeout(() => {
    extension.statusBar.setRateLimited(false);
  }, rateLimitData.time * 1000);
});
