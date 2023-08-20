import { t } from "@vscode/l10n";
import { discloud } from "discloud.app";
import { decode } from "jsonwebtoken";
import { setTimeout as sleep } from "node:timers/promises";
import { Dispatcher, request } from "undici";
import { window } from "vscode";
import { RequestOptions } from "../@types";
import extension from "../extension";
import { CPU_ARCH, OS_NAME, OS_PLATFORM, OS_RELEASE, VERSION } from "./constants";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let { maxUses, time, remain, tokenIsValid } = {
  maxUses: 60,
  time: 60,
  remain: 60,
  tokenIsValid: true,
};

export { tokenIsValid };

async function initTimer() {
  await sleep(time * 1000);
  remain = maxUses;
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

  const processPath = `/${url.split("/").slice(4).join("/") ?? url.split("/").at(-1)}`;
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

  config.headersTimeout ??= 60000;
  Object.assign(config.headers ??= {}, {
    "api-token": extension.token,
    "User-Agent": `vscode/${VERSION} (${OS_NAME} ${OS_RELEASE}; ${OS_PLATFORM}; ${CPU_ARCH})`,
  }, typeof config.body === "string" ? {
    "Content-Type": "application/json",
  } : {});

  let response: Dispatcher.ResponseData;
  try {
    response = await request(`https://api.discloud.app/v2${url}`, config);
  } catch {
    if (isVS) {
      vsProcesses.delete(processKey);
    } else {
      processes.shift();
    }

    throw Error("Missing Connection");
  }

  time = Number(response.headers["ratelimit-reset"]);
  initTimer();
  maxUses = Number(response.headers["ratelimit-limit"]);
  remain = Number(response.headers["ratelimit-remaining"]);

  if (!remain)
    extension.emit("rateLimited", {
      time,
    });

  if (isVS) {
    vsProcesses.delete(processKey);
  } else {
    processes.shift();
  }

  if (response.statusCode > 399) {
    switch (response.statusCode) {
      case 401:
        tokenIsValid = false;
        extension.emit("unauthorized");
        break;
    }

    throw Object.assign(response, { body: await response.body.json() });
  }

  return response.body.json() as T;
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
