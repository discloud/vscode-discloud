import { t } from "@vscode/l10n";
import { discloud, RouteBases, type RouteLike } from "discloud.app";
import { EventEmitter } from "events";
import { decode } from "jsonwebtoken";
import { window } from "vscode";
import { type RequestOptions } from "../../@types";
import extension, { logger } from "../../extension";
import { DEFAULT_USER_AGENT } from "../../util/constants";
import DiscloudAPIError from "./error";

let { limit, remain, reset, time, tokenIsValid } = {
  limit: 60,
  remain: 60,
  reset: 60,
  time: 0,
  tokenIsValid: false,
};

export { tokenIsValid };

let timer: NodeJS.Timeout | null = null;
function initTimer() {
  if (timer) return;
  timer = setTimeout(function () {
    timer = null;
    remain = limit;
    extension.debug("[ratelimit]: restored");
  }, reset * 1000 + time - Date.now());
}

export const requesterEmitter = new EventEmitter();

requesterEmitter.on("headers", async function (headers: Headers) {
  time = Date.now();

  const Limit = parseInt(headers.get("ratelimit-limit")!);
  const Remaining = parseInt(headers.get("ratelimit-remaining")!);
  const Reset = parseInt(headers.get("ratelimit-reset")!);
  if (!isNaN(Limit)) limit = Math.max(Limit, 0);
  if (!isNaN(Limit)) remain = Math.max(Remaining, 0);
  if (!isNaN(Limit)) reset = Math.max(Reset, 0);
  initTimer();

  extension.debug("[ratelimit]:", "limit", Limit, "remaining", Remaining, "reset", Reset);

  if (!remain) extension.emit("rateLimited", { reset, time });
});

const noQueueProcesses: string[] = [];
const queueProcesses = new Set<string>();

async function waitQueue(key: string) {
  while (queueProcesses.has(key)) {
    await new Promise((resolve) => {
      function onResume(k: string) {
        if (k === key) {
          clearTimeout(timer);
          requesterEmitter.removeListener("resume", onResume);
          resolve(k);
        }
      }

      const timer = setTimeout(function () {
        requesterEmitter.removeListener("resume", onResume);
        resolve(null);
      }, 10000);

      requesterEmitter.on("resume", onResume);
    });
  }
}

export async function requester<T>(path: RouteLike, config: RequestOptions = {}, queue?: boolean): Promise<T | null> {
  if (!tokenIsValid) return null;

  if (!remain) {
    extension.emit("rateLimited", { reset, time });
    return null;
  }

  const processKey = `${config.method ??= "GET"}.${path}`;

  if (queue) {
    await waitQueue(processKey);

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
    response = await fetch(`${RouteBases.api}${path}`, config);
  } catch {
    if (queue) {
      queueProcesses.delete(processKey);
      requesterEmitter.emit("resume", processKey);
    } else {
      noQueueProcesses.shift();
    }

    extension.emit("missingConnection");
    throw Error("Missing Connection");
  }

  requesterEmitter.emit("headers", response.headers);

  if (queue) {
    queueProcesses.delete(processKey);
    requesterEmitter.emit("resume", processKey);
  } else {
    noQueueProcesses.shift();
  }

  let responseBody: any;
  if (response.headers.get("content-type")?.includes("application/json")) {
    responseBody = await response.json();
  } else if (response.headers.get("content-type")?.includes("text/")) {
    responseBody = await response.text();
  } else {
    responseBody = await response.arrayBuffer();
  }

  if (!response.ok) {
    switch (response.status) {
      case 401:
        tokenIsValid = false;
        extension.emit("unauthorized");
        logger.info(`${path} ${responseBody}`);
        break;
    }


    throw new DiscloudAPIError(responseBody, response.status, config?.method ?? "GET", path, config?.body);
  }

  return responseBody as T;
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
