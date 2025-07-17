import { t } from "@vscode/l10n";
import { window } from "vscode";
import core from "../extension";

let timer: NodeJS.Timeout | null = null;

core.on("rateLimited", async function (rateLimitData) {
  if (timer || isNaN(rateLimitData.reset) || isNaN(rateLimitData.time)) return;

  const reset = rateLimitData.reset * 1000 + rateLimitData.time - Date.now();

  const time = Math.round(reset / 1000);

  core.logger.warn("Rate limited by " + time + " seconds");

  void window.showInformationMessage(t("ratelimited", { s: time }));

  core.statusBar.setRateLimited(true);

  timer = setTimeout(() => {
    timer = null;
    core.statusBar.setRateLimited(false);
  }, reset);
});
