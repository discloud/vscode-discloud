import { t } from "@vscode/l10n";
import { RouteLike, discloud } from "discloud.app";
import { decode } from "jsonwebtoken";
import { setTimeout as sleep } from "node:timers/promises";
import { Dispatcher, request } from "undici";
import { window } from "vscode";
import { RequestOptions } from "../@types";
import extension, { logger } from "../extension";
import { DEFAULT_USER_AGENT } from "./constants";

let { limit, remain, reset, time, timer, tokenIsValid } = {
  limit: 60,
  remain: 60,
  reset: 60,
  time: 0,
  timer: false,
  tokenIsValid: true,
};

export { tokenIsValid };

async function initTimer() {
  if (timer) return;
  timer = true;
  await sleep(reset * 1000 + time - Date.now());
  timer = false;
  remain = limit;
  if (extension.debug) logger.info("[ratelimit]: restored");
}

interface ProcessData {
  isVS: boolean
  method: RequestOptions["method"]
  path: string
}

const processes: string[] = [];
const vsProcesses = new Map<string, ProcessData>();

export async function requester<T = any>(path: RouteLike, config: RequestOptions = {}, isVS?: boolean): Promise<T> {
  if (!tokenIsValid) return <T>false;

  if (!remain) {
    extension.emit("rateLimited", {
      reset,
      time,
    });

    return <T>false;
  }

  const processKey = `${config.method ??= "GET"}.${path}`;

  if (isVS) {
    const existing = vsProcesses.get(processKey);

    if (existing) {
      window.showErrorMessage(t("process.already.running"));
      return <T>false;
    } else {
      vsProcesses.set(processKey, {
        isVS: true,
        method: config.method,
        path: path,
      });
    }
  } else {
    if (processes.length) {
      window.showErrorMessage(t("process.already.running"));
      return <T>false;
    } else {
      processes.push(path);
    }
  }

  config.headersTimeout ??= 60000;
  Object.assign(config.headers ??= {}, {
    "api-token": extension.token,
    "User-Agent": DEFAULT_USER_AGENT,
  }, typeof config.body === "string" ? {
    "Content-Type": "application/json",
  } : {});

  if (extension.debug)
    logger.info("Request:", path, "Headers:", Object.fromEntries(Object.entries(config.headers).map(([k, v]) => [k, typeof v])));

  let response: Dispatcher.ResponseData;
  try {
    response = await request(`https://api.discloud.app/v2${path}`, config);
  } catch {
    if (isVS) {
      vsProcesses.delete(processKey);
    } else {
      processes.shift();
    }

    throw Error("Missing Connection");
  }

  time = Date.now();
  const Limit = Number(response.headers["ratelimit-limit"]);
  const Remaining = Number(response.headers["ratelimit-remaining"]);
  const Reset = Number(response.headers["ratelimit-reset"]);
  if (!isNaN(Limit)) limit = Limit;
  if (!isNaN(Remaining)) remain = Remaining;
  if (!isNaN(Reset)) reset = Reset;
  initTimer();

  if (extension.debug) {
    logger.info("[ratelimit]:", "limit", Limit, "remaining", Remaining, "reset", Reset);
  }

  if (!remain)
    extension.emit("rateLimited", {
      reset,
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
        logger.info(`${path} ${await response.body.json().catch(() => response.body.text())}`);
        break;
    }

    if (response.headers["content-type"]?.includes("application/json"))
      throw Object.assign(response, { body: await response.body.json() });

    if (response.headers["content-type"]?.includes("text/"))
      throw Object.assign(response, { body: await response.body.text() });

    throw Object.assign(response, { body: await response.body.arrayBuffer() });
  }

  if (response.headers["content-type"]?.includes("application/json"))
    return await response.body.json() as T;

  if (response.headers["content-type"]?.includes("text/"))
    return await response.body.text() as T;

  return await response.body.arrayBuffer() as T;
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
