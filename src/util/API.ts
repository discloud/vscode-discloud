import { t } from "@vscode/l10n";
import { discloud } from "discloud.app";
import { setTimeout as sleep } from "node:timers/promises";
import { request } from "undici";
import { window } from "vscode";
import { RequestOptions } from "../@types";
import extension from "../extension";
import { cpu_arch, os_name, os_platform, os_release, version } from "./constants";

let { maxUses, uses, time, remain } = {
  maxUses: 60,
  uses: 0,
  time: 60000,
  remain: 60,
};

async function initTimer() {
  await sleep(time);
  uses = 0;
}

const processes: string[] = [];

export async function requester<T = any>(url: string | URL, config: RequestOptions = {}, isVS?: boolean): Promise<T> {
  if (!isVS)
    if (processes.length) {
      window.showErrorMessage(t("process.already.running"));
      return <T>false;
    } else {
      processes.push(url.toString().split("/").pop()!);
    }

  if (!remain || maxUses < uses) {
    window.showInformationMessage(t("ratelimited", { s: Math.floor(time / 1000) }));

    extension.emit("rateLimited", {
      time,
    });

    return <T>false;
  }

  config.throwOnError = true;
  config.headersTimeout = config.headersTimeout ?? 60000;
  config.headers = {
    ...(typeof config.body === "string" ? {
      "Content-Type": "application/json",
    } : {}),
    "api-token": `${extension.token}`,
    ...(config.headers ?? {}),
    "User-Agent": `vscode/${version} (${os_name} ${os_release}; ${os_platform}; ${cpu_arch})`,
  };

  uses++;
  try {
    const response = await request(`https://api.discloud.app/v2${url}`, config);

    if (!isVS) processes.shift();

    maxUses = parseInt(`${response.headers["ratelimit-limit"]}`);
    time = parseInt(`${response.headers["ratelimit-reset"]}`) * 1000;
    remain = parseInt(`${response.headers["ratelimit-remaining"]}`);
    initTimer();

    if (!remain || maxUses < uses)
      extension.emit("rateLimited", {
        time,
      });

    return response.body.json();
  } catch (error: any) {
    if (!isVS) processes.shift();

    window.showErrorMessage(`${error.body?.message ? error.body.message : error}`);

    return error;
  }
}

export async function tokenValidator(token: string) {
  try {
    await discloud.login(token);
    return true;
  } catch {
    return false;
  }
}
