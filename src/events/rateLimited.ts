import { t } from "@vscode/l10n";
import { window } from "vscode";
import { type RateLimitData } from "../@types";
import type ExtensionCore from "../core/extension";

const eventName = "rateLimited";

export default async function (core: ExtensionCore, rateLimitData: RateLimitData) {
  if (core.timers.has(eventName) || isNaN(rateLimitData.reset) || isNaN(rateLimitData.time)) return;

  const reset = rateLimitData.reset * 1000 + rateLimitData.time - Date.now();

  const time = Math.round(reset / 1000);

  core.logger.warn("Rate limited by " + time + " seconds");

  core.timers.setTimeout(eventName, () => {
    core.timers.delete(eventName);
    core.statusBar.setRateLimited(false);
  }, reset);

  core.statusBar.setRateLimited(true);

  void window.showInformationMessage(t(eventName, { s: time }));
}
