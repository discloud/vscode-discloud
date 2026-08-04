import { t } from "@vscode/l10n";
import { window } from "vscode";
import type { RateLimitData } from "../@types";
import type ExtensionCore from "../core/extension";

const eventName = "rateLimited";
const _sInMs = 1_000;

export default async function (core: ExtensionCore, rateLimitData: RateLimitData) {
  if (core.timers.has(eventName) || isNaN(rateLimitData.reset) || isNaN(rateLimitData.time)) return;

  const resetTime = rateLimitData.reset * _sInMs + rateLimitData.time - Date.now();

  const time = Math.round(resetTime / _sInMs);

  core.logger.warn(`Rate limited by ${time} seconds`);

  core.timers.setTimeout(eventName, () => core.statusBar.setRateLimited(false), resetTime);

  core.statusBar.setRateLimited(true);

  void window.showInformationMessage(t(eventName, { s: time }));
}
