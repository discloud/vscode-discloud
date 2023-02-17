import { t } from "@vscode/l10n";
import { window } from "vscode";
import extension from "../extension";

extension.on("rateLimited", (rateLimitData) => {
  extension.logger.warn("Rate limited by " + rateLimitData.time + " seconds");

  extension.statusBar.setRateLimited(true);

  setTimeout(() => {
    extension.statusBar.setRateLimited(false);
  }, rateLimitData.time * 1000);

  window.showInformationMessage(t("ratelimited", {
    s: Math.floor(rateLimitData.time),
  }));
});
