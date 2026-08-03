import { RouteBases } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { EventEmitter } from "events";
import { constants } from "http2";
import { window } from "vscode";
import type ExtensionCore from "../../core/extension";
import AsyncQueue from "../../modules/async-queue";
import { RequestMethod } from "./enum";
import DiscloudAPIError from "./errors/api";
import type { InternalRequestData, RequestData, RESTOptions, RouteLike } from "./types";

const _defaultRateLimitLimit = 60;
const _minimumRateRemaining = 1;
const _sInMs = 1_000;

export default class REST extends EventEmitter {
  constructor(readonly core: ExtensionCore, options?: Partial<RESTOptions>) {
    super({ captureRejections: true });

    this.options = options ?? {};
  }

  declare readonly options: Partial<RESTOptions>;
  readonly #queue = new AsyncQueue();
  authorized: boolean = true;

  #limit = _defaultRateLimitLimit;
  #remaining = _defaultRateLimitLimit;
  #reset = _defaultRateLimitLimit;
  #time!: number;

  get baseURL() { return RouteBases.api; }

  get limit(): number { return this.#limit; }
  get remaining(): number { return this.#remaining; }
  get reset(): number { return this.#reset; }

  get limited(): boolean { return this.#remaining < _minimumRateRemaining; }
  get timeToReset(): number { return this.#reset * _sInMs + this.#time - Date.now(); }

  getSession() {
    return this.core.auth.getSession();
  }

  async getToken() {
    const session = await this.getSession();
    return session?.accessToken;
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

  request<T>(url: URL, config?: RequestInit | null, inQueue?: boolean): Promise<T>
  async request(url: URL, config: RequestInit | null, inQueue = false) {
    if (!this.authorized) return null;

    if (this.limited) {
      this.core.emit("rateLimited", this.core, { reset: this.#reset, time: this.#time });
      return null;
    }

    config ??= {};

    const pathname = url.pathname;

    const processKey = `${config.method ??= "GET"}.${pathname}`;

    if (inQueue) {
      await this.#queue.wait(processKey);

      if (this.limited) {
        this.#queue.shift(processKey);
        return null;
      }
    } else {
      if (this.#noQueueProcesses.length) {
        void window.showErrorMessage(t("process.already.running", this.#noQueueProcesses.length));
        return null;
      } else {
        this.#noQueueProcesses.push(processKey);
      }
    }

    queueMicrotask(() => this.core.debug(
      "Request:", pathname,
      "Headers:", Object.entries(config.headers!).map(([k, v]) => `${k}:${typeof v}(${`${v}`.length})`).join(" "),
    ));

    this.#remaining--;
    let response: Response;
    try {
      response = await fetch(url, config);
    } catch {
      this.core.emit("missingConnection", this.core);
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
        case constants.HTTP_STATUS_UNAUTHORIZED:
          this.core.emit("unauthorized", this.core);
          break;
        case constants.HTTP_STATUS_TOO_MANY_REQUESTS:
          this.core.emit("rateLimited", this.core, { reset: this.#reset, time: this.#time });
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
    const options: RequestInit = { method: request.method };

    if (!request.fullRoute.startsWith("/")) request.fullRoute = `/${request.fullRoute}`;

    const url = new URL(this.baseURL + request.fullRoute);
    const formData = new FormData();

    const headers = new Headers(Object.assign({
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
    this.#time = Date.now();

    const Limit = parseInt(headers.get("ratelimit-limit")!);
    const Remaining = parseInt(headers.get("ratelimit-remaining")!);
    const Reset = parseInt(headers.get("ratelimit-reset")!);
    if (!isNaN(Limit)) this.#limit = Math.max(Limit, 0);
    if (!isNaN(Remaining)) this.#remaining = Math.max(Remaining, 0);
    if (!isNaN(Reset)) {
      this.#reset = Math.max(Reset, 0);
      this.#initRateLimitResetTimer();
    }
  }

  #timer!: NodeJS.Timeout | null;
  #initRateLimitResetTimer() {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = null;
      this.#remaining = this.#limit;
    }, this.timeToReset).unref();
  }

  readonly #noQueueProcesses: string[] = [];
}
