import { t } from "@vscode/l10n";
import { RouteLike, discloud } from "discloud.app";
import { EventEmitter } from "events";
import { decode } from "jsonwebtoken";
import { setTimeout as sleep } from "timers/promises";
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
  extension.debug("[ratelimit]: restored");
}

const emitter = new EventEmitter({ captureRejections: true });

emitter.on("headers", async function (headers: Headers) {
  time = Date.now();

  const Limit = Number(headers.get("ratelimit-limit"));
  const Remaining = Number(headers.get("ratelimit-remaining"));
  const Reset = Number(headers.get("ratelimit-reset"));
  if (!isNaN(Limit)) limit = Limit;
  if (!isNaN(Remaining)) remain = Remaining;
  if (!isNaN(Reset)) reset = Reset;
  initTimer();

  extension.debug("[ratelimit]:", "limit", Limit, "remaining", Remaining, "reset", Reset);

  if (!remain) extension.emit("rateLimited", { reset, time });
});

const noQueueProcesses: string[] = [];
const queueProcesses = new Set<string>();

export async function requester<T>(path: RouteLike, config: RequestOptions = {}, queue?: boolean): Promise<T | null> {
  if (!tokenIsValid) return null;

  if (!remain) {
    extension.emit("rateLimited", { reset, time });
    return null;
  }

  const processKey = `${config.method ??= "GET"}.${path}`;

  if (queue) {
    while (queueProcesses.has(processKey)) {
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

    queueProcesses.add(processKey);
  } else {
    if (noQueueProcesses.length) {
      window.showErrorMessage(t("process.already.running"));
      return null;
    } else {
      noQueueProcesses.push(processKey);
    }
  }

  Object.assign(config.headers ??= {}, {
    "api-token": extension.token,
    "User-Agent": DEFAULT_USER_AGENT,
  }, typeof config.body === "string" ? {
    "Content-Type": "application/json",
  } : {});

  extension.debug("Request:", path, "Headers:", Object.fromEntries(Object.entries(config.headers).map(([k, v]) => [k, typeof v])));

  let response: Response;
  try {
    response = await fetch(`https://api.discloud.app/v2${path}`, config);
  } catch {
    if (queue) {
      queueProcesses.delete(processKey);
      emitter.emit("resume", processKey);
    } else {
      noQueueProcesses.shift();
    }

    extension.emit("missingConnection");
    throw Error("Missing Connection");
  }

  emitter.emit("headers", response.headers);

  if (queue) {
    queueProcesses.delete(processKey);
    emitter.emit("resume", processKey);
  } else {
    noQueueProcesses.shift();
  }

  if (response.status > 399) {
    switch (response.status) {
      case 401:
        tokenIsValid = false;
        extension.emit("unauthorized");
        logger.info(`${path} ${await response.json().catch(() => response.text())}`);
        break;
    }

    if (response.headers.get("content-type")?.includes("application/json"))
      throw Object.assign(response, { body: await response.json() });

    if (response.headers.get("content-type")?.includes("text/"))
      throw Object.assign(response, { body: await response.text() });

    throw Object.assign(response, { body: await response.arrayBuffer() });
  }

  if (response.headers.get("content-type")?.includes("application/json"))
    return await response.json() as T;

  if (response.headers.get("content-type")?.includes("text/"))
    return await response.text() as T;

  return await response.arrayBuffer() as T;
}

export function tokenIsDiscloudJwt(token = extension.token!): boolean {
  const payload = decode(token, { json: true });
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
