import { t } from "@vscode/l10n";
import { RouteLike, discloud } from "discloud.app";
import { decode } from "jsonwebtoken";
import { EventEmitter } from "node:events";
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
  tokenIsValid: false,
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

const emitter = new EventEmitter({ captureRejections: true });

const queueProcesses: string[] = [];
const noQueueProcesses = new Set<string>();

export async function requester<T = any>(path: RouteLike, config: RequestOptions = {}, noQueue?: boolean): Promise<T | null> {
  if (!tokenIsValid) return null;

  if (!remain) {
    extension.emit("rateLimited", {
      reset,
      time,
    });

    return null;
  }

  const processKey = `${config.method ??= "GET"}.${path}`;

  if (noQueue) {
    while (noQueueProcesses.has(processKey)) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(), 10000);

        emitter.once("resume", (key) => {
          if (key === processKey) {
            clearTimeout(timer);
            resolve(key);
          }
        });
      }).catch(() => null);
    }

    if (!remain) return null;

    noQueueProcesses.add(processKey);
  } else {
    if (queueProcesses.length) {
      window.showErrorMessage(t("process.already.running"));
      return null;
    } else {
      queueProcesses.push(processKey);
    }
  }

  config.headersTimeout ??= 60000;
  Object.assign(config.headers ??= {}, {
    "api-token": extension.token,
    "User-Agent": DEFAULT_USER_AGENT,
  }, typeof config.body === "string" ? {
    "Content-Type": "application/json",
  } : {});

  if (extension.debug) {
    logger.info("Request:", path, "Headers:", Object.fromEntries(Object.entries(config.headers).map(([k, v]) => [k, typeof v])));
  }

  let response: Dispatcher.ResponseData;
  try {
    response = await request(`https://api.discloud.app/v2${path}`, config);
  } catch {
    if (noQueue) {
      noQueueProcesses.delete(processKey);
      emitter.emit("resume", processKey);
    } else {
      queueProcesses.shift();
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

  if (noQueue) {
    noQueueProcesses.delete(processKey);
    emitter.emit("resume", processKey);
  } else {
    queueProcesses.shift();
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
      if (extension.token === token) {
        tokenIsValid = true;
        await extension.user.fetch(true);
        discloud.rest.setToken(token);
      } else {
        await discloud.login(token);
      }
      extension.emit("authorized", token, isWorkspace);
      return true;
    } else {
      tokenIsValid = false;
      extension.emit("unauthorized");
      return false;
    }
  } catch {
    return false;
  }
}
