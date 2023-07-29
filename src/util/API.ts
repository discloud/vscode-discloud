import { t } from "@vscode/l10n";
import { discloud } from "discloud.app";
import { decode } from "jsonwebtoken";
import { setTimeout as sleep } from "node:timers/promises";
import { request } from "undici";
import { window } from "vscode";
import { RequestOptions } from "../@types";
import extension from "../extension";
import { cpu_arch, os_name, os_platform, os_release, version } from "./constants";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let { maxUses, uses, time, remain, tokenIsValid } = {
  maxUses: 60,
  uses: 0,
  time: 60000,
  remain: 60,
  tokenIsValid: true,
};

export { tokenIsValid };

async function initTimer() {
  await sleep(time * 1000);
  uses = 0;
}

interface ProcessData {
  isVS: boolean
  method: RequestOptions["method"]
  path: string
  url: string
}

const processes: string[] = [];
const vsProcesses = new Map<string, ProcessData>();

export async function requester<T = any>(url: string | URL, config: RequestOptions = {}, isVS?: boolean): Promise<T> {
  if (!tokenIsValid) return <T>false;

  if (!remain) {
    extension.emit("rateLimited", {
      time,
    });

    return <T>false;
  }

  url = url.toString();

  const processPath = url.split("/").pop()!;
  const processKey = `${config.method ??= "GET"}.${processPath}`;

  if (isVS) {
    const existing = vsProcesses.get(processKey);

    if (existing) {
      window.showErrorMessage(t("process.already.running"));
      return <T>false;
    } else {
      vsProcesses.set(processKey, {
        isVS: true,
        method: config.method,
        path: processPath,
        url,
      });
    }
  } else {
    if (processes.length) {
      window.showErrorMessage(t("process.already.running"));
      return <T>false;
    } else {
      processes.push(processPath);
    }
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

    if (isVS) {
      vsProcesses.delete(processKey);
    } else {
      processes.shift();
    }

    time = Number(response.headers["ratelimit-reset"]);
    initTimer();
    maxUses = Number(response.headers["ratelimit-limit"]);
    remain = Number(response.headers["ratelimit-remaining"]);

    if (!remain)
      extension.emit("rateLimited", {
        time,
      });

    return response.body.json();
  } catch (error: any) {
    if (isVS) {
      vsProcesses.delete(processKey);
    } else {
      processes.shift();
    }

    switch (error.code) {
      case "DEPTH_ZERO_SELF_SIGNED_CERT":
      case "ENOTFOUND":
        uses--;
        extension.emit("missingConnection");
        throw Error("Missing Connection");
    }

    extension.emit("error", error);

    switch (error.statusCode ?? error.status) {
      case 401:
        tokenIsValid = false;
        extension.emit("unauthorized");
        break;
    }

    return error;
  }
}

export function tokenIsDiscloudJwt(token = extension.token): boolean {
  const payload = decode(token!, { json: true });
  return payload && "id" in payload && "key" in payload || false;
}

export async function tokenValidator(token: string, isWorkspace?: boolean) {
  try {
    if (tokenIsDiscloudJwt(token)) {
      await discloud.login(token);
      tokenIsValid = true;
      extension.emit("authorized", token, isWorkspace);
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
