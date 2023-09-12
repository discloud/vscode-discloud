import { t } from "@vscode/l10n";
import { window } from "vscode";
import extension from "../extension";

let timer: NodeJS.Timeout;

extension.on("rateLimited", async (rateLimitData) => {
  if (isNaN(rateLimitData.reset) || isNaN(rateLimitData.time)) return;

  clearTimeout(timer);

  const reset = rateLimitData.reset * 1000 + rateLimitData.time - Date.now();

  const time = Math.round(reset / 1000);

  extension.logger.warn("Rate limited by " + time + " seconds");

  window.showInformationMessage(t("ratelimited", {
    s: time,
  }));

  extension.statusBar.setRateLimited(true);

  timer = setTimeout(() => {
    extension.statusBar.setRateLimited(false);
  }, reset);
});
