import { t } from "@vscode/l10n";
import { window } from "vscode";
import extension from "../extension";

let ratelimits = 0;

extension.on("rateLimited", (rateLimitData) => {
  extension.logger.warn("Rate limited by " + rateLimitData.time + " seconds");

  ratelimits++;

  extension.statusBar.setRateLimited(true);

  setTimeout(() => {
    ratelimits--;

    if (!ratelimits) {
      extension.statusBar.setRateLimited(false);
    }
  }, rateLimitData.time * 1000);

  window.showInformationMessage(t("ratelimited", {
    s: Math.floor(rateLimitData.time),
  }));
});
