import { t } from "@vscode/l10n";
import { RouteBases, type RouteLike } from "discloud.app";
import { EventEmitter } from "events";
import { window } from "vscode";
import type ExtensionCore from "../../core/extension";
import AsyncQueue from "../../modules/async-queue";
import { RequestMethod } from "./enum";
import DiscloudAPIError from "./errors/api";
import { type InternalRequestData, type RequestData, type RequestOptions, type RESTOptions } from "./types";

export default class REST extends EventEmitter {
  limit = 60;
  remaining = 60;
  reset = 60;
  declare time: number;
  declare authorized: boolean;
  declare readonly options: Partial<RESTOptions>;
  readonly #queue = new AsyncQueue();

  get baseURL() {
    return RouteBases.api;
  }

  get limited() {
    return !this.remaining;
  }

  get timeToReset(): number {
    return this.reset * 1000 + this.time - Date.now();
  }

  getToken() {
    return this.core.secrets.getToken();
  }

  constructor(private core: ExtensionCore, options?: Partial<RESTOptions>) {
    super();

    this.options = options ?? {};
  }

  delete<T>(fullRoute: RouteLike, options: RequestData = {}): Promise<T> {
    return this.#raw(Object.assign({}, options, { fullRoute, method: RequestMethod.Delete }));
  }

  get<T>(fullRoute: RouteLike, options: RequestData = {}): Promise<T> {
    return this.#raw(Object.assign({}, options, { fullRoute, method: RequestMethod.Get }));
  }

  post<T>(fullRoute: RouteLike, options: RequestData = {}): Promise<T> {
    return this.#raw(Object.assign({}, options, { fullRoute, method: RequestMethod.Post }));
  }

  put<T>(fullRoute: RouteLike, options: RequestData = {}): Promise<T> {
    return this.#raw(Object.assign({}, options, { fullRoute, method: RequestMethod.Put }));
  }

  queueDelete<T>(fullRoute: RouteLike, options: RequestData = {}): Promise<T> {
    return this.#raw(Object.assign({}, options, { fullRoute, method: RequestMethod.Delete }), true);
  }

  queueGet<T>(fullRoute: RouteLike, options: RequestData = {}): Promise<T> {
    return this.#raw(Object.assign({}, options, { fullRoute, method: RequestMethod.Get }), true);
  }

  queuePost<T>(fullRoute: RouteLike, options: RequestData = {}): Promise<T> {
    return this.#raw(Object.assign({}, options, { fullRoute, method: RequestMethod.Post }), true);
  }

  queuePut<T>(fullRoute: RouteLike, options: RequestData = {}): Promise<T> {
    return this.#raw(Object.assign({}, options, { fullRoute, method: RequestMethod.Put }), true);
  }

  request<T>(url: URL, config?: RequestOptions | null, inQueue?: boolean): Promise<T>
  async request(url: URL, config: RequestOptions = {}, inQueue = false) {
    if (!this.authorized) return null;

    if (this.limited) {
      this.core.emit("rateLimited", { reset: this.reset, time: this.time });
      return null;
    }

    const pathname = url.pathname;

    const processKey = `${config.method ??= "GET"}.${pathname}`;

    if (inQueue) {
      await this.#queue.wait(processKey);

      if (this.limited) return null;
    } else {
      if (this.#noQueueProcesses.length) {
        await window.showErrorMessage(t("process.already.running", this.#noQueueProcesses.length));
        return null;
      } else {
        this.#noQueueProcesses.push(processKey);
      }
    }

    queueMicrotask(() => this.core.emit("debug",
      "Request:", pathname,
      "Headers:", Object.entries(config.headers!).map(([k, v]) => `${k}:${typeof v}(${`${v}`.length})`).join(" "),
    ));

    this.remaining--;
    let response: Response;
    try {
      response = await fetch(url, config);
    } catch {
      this.core.emit("missingConnection");
      throw Error(t("missing.connection"));
    } finally {
      if (inQueue) {
        this.#queue.shift(processKey);
      } else {
        this.#noQueueProcesses.shift();
      }
    }

    queueMicrotask(() => this.#resolveResponseHeaders(response.headers));

    const responseBody = await this.#resolveResponseBody(response);

    if (!response.ok) {
      switch (response.status) {
        case 401:
          this.core.emit("unauthorized");
          break;
      }

      throw new DiscloudAPIError(responseBody, response.status, config.method, pathname, config.body);
    }

    return responseBody;
  }

  async #raw<T>(options: InternalRequestData, inQueue?: boolean) {
    const request = await this.#resolveRequest(options);

    return this.request<T>(request.url, request.options, inQueue);
  }

  async #resolveRequest(request: InternalRequestData) {
    const options: RequestOptions = { method: request.method };

    if (!request.fullRoute.startsWith("/")) request.fullRoute = `/${request.fullRoute}`;

    const url = new URL(this.baseURL + request.fullRoute);
    const formData = new FormData();

    const headers = new Headers(Object.assign({}, {
      "api-token": await this.getToken(),
      "User-Agent": this.options.userAgent,
    }, request.headers));

    if (request.query) url.search = new URLSearchParams(request.query).toString();

    const hasFiles = Boolean(request.files?.length);

    if (hasFiles) {
      for (let i = 0; i < request.files!.length; i++) {
        const file = request.files![i];
        formData.append(file.name, file);
      }
    }

    if (request.body) {
      if (hasFiles) {
        if (typeof request.body === "string")
          try { request.body = JSON.parse(request.body); } catch { }

        if (request.body !== null)
          for (const key in request.body)
            formData.append(key, request.body[key as keyof InternalRequestData["body"]]);
      } else {
        headers.set("Content-Type", "application/json");

        if (typeof request.body === "string") {
          options.body = request.body;
        } else {
          options.body = JSON.stringify(request.body);
        }
      }
    }

    if (hasFiles) options.body = formData;

    options.headers = Object.fromEntries(headers.entries());

    return { url, options };
  }

  #resolveResponseBody<T>(response: Response): Promise<T>
  #resolveResponseBody(response: Response) {
    const contentType = response.headers.get("content-type");

    if (typeof contentType === "string") {
      if (contentType.includes("application/json"))
        return response.json();

      if (contentType.includes("text/"))
        return response.text();
    }

    return response.arrayBuffer();
  }

  #resolveResponseHeaders(headers: Headers) {
    this.time = Date.now();

    const Limit = parseInt(headers.get("ratelimit-limit")!);
    const Remaining = parseInt(headers.get("ratelimit-remaining")!);
    const Reset = parseInt(headers.get("ratelimit-reset")!);
    if (!isNaN(Limit)) this.limit = Math.max(Limit, 0);
    if (!isNaN(Remaining)) this.remaining = Math.max(Remaining, 0);
    if (!isNaN(Reset)) this.reset = Math.max(Reset, 0);

    this.#initRateLimitResetTimer();
  }

  #timer!: NodeJS.Timeout | null;
  #initRateLimitResetTimer() {
    if (this.#timer) return;
    this.#timer = setTimeout(() => {
      this.#timer = null;
      this.remaining = this.limit;
    }, this.timeToReset);
  }

  readonly #noQueueProcesses: string[] = [];
}
