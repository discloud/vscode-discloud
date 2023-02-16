import { t } from "@vscode/l10n";
import { discloud } from "discloud.app";
import { decode } from "jsonwebtoken";
import { setTimeout as sleep } from "node:timers/promises";
import { request } from "undici";
import { window } from "vscode";
import { RequestOptions } from "../@types";
import extension from "../extension";
import { cpu_arch, os_name, os_platform, os_release, version } from "./constants";

let { maxUses, uses, time, remain, tokenIsValid } = {
  maxUses: 60,
  uses: 0,
  time: 60000,
  remain: 60,
  tokenIsValid: true,
};

async function initTimer() {
  await sleep(time);
  uses = 0;
}

const processes: string[] = [];

export async function requester<T = any>(url: string | URL, config: RequestOptions = {}, isVS?: boolean): Promise<T> {
  if (!tokenIsValid) return <T>false;

  if (!remain || maxUses < uses) {
    extension.emit("rateLimited", {
      time,
    });

    return <T>false;
  }

  if (!isVS)
    if (processes.length) {
      window.showErrorMessage(t("process.already.running"));
      return <T>false;
    } else {
      processes.push(url.toString().split("/").pop()!);
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

    maxUses = Number(response.headers["ratelimit-limit"]);
    time = Number(response.headers["ratelimit-reset"]);
    remain = Number(response.headers["ratelimit-remaining"]);
    initTimer();

    if (!remain || maxUses < uses)
      extension.emit("rateLimited", {
        time,
      });

    return response.body.json();
  } catch (error: any) {
    if (!isVS) processes.shift();

    extension.emit("error", error);

    switch (error.status ?? error.statusCode) {
      case 401:
        tokenIsValid = false;
        extension.emit("unauthorized");
        break;
      default:
        break;
    }

    return error;
  }
}

export function tokenIsDiscloudJwt(token = extension.token): boolean {
  const payload = decode(token!, { json: true });
  return payload && "id" in payload && "key" in payload || false;
}

export async function tokenValidator(token: string) {
  try {
    if (tokenIsDiscloudJwt(token)) {
      await discloud.login(token);
      tokenIsValid = true;
      extension.emit("authorized");
      return true;
    } else {
      tokenIsValid = false;
      extension.emit("unauthorized");
      return false;
    }
  } catch {
    tokenIsValid = false;
    extension.emit("unauthorized");
    return false;
  }
}
