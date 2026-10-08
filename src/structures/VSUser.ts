import { type RESTPutApiLocaleResult, Routes } from "@discloudapp/api-types/v2";
import type { ApiVscodeApp, ApiVscodeUser, RESTGetApiVscode } from "../@types";
import type ExtensionCore from "../core/extension";
import { GlobalStorageKeys, ONE_MINUTE_IN_MILLISECONDS, TEN_SECONDS_IN_MILLISECONDS } from "../utils/constants";

export default class VSUser implements ApiVscodeUser {
  constructor(readonly core: ExtensionCore) { }

  readonly apps: string[] = [];
  readonly appsStatus: ApiVscodeApp[] = [];
  readonly appsTeam: string[] = [];
  readonly customdomains: string[] = [];
  readonly subdomains: string[] = [];
  declare avatar: string | null;
  declare locale: string;
  declare readonly plan: string;
  declare readonly planDataEnd: string;
  declare readonly ramUsedMb: number;
  declare readonly totalRamMb: number;
  declare readonly userID: string;
  declare readonly username: string;

  #fetchTimestamp!: number;

  #upsertFetchTimestamp(currentTimestampValue: number) {
    return this.core.globalStorage.upsert<number>(GlobalStorageKeys.fetchUserTimestamp, currentTimestampValue);
  }

  async fetch(isInternal?: boolean) {
    const now = Date.now();
    const isDefinedFetchTimestamp = typeof this.#fetchTimestamp === "number";
    const fetchTimestamp = this.#fetchTimestamp = await this.#upsertFetchTimestamp(now);
    const isFetchTimeLessThanOneMinuteAgo = (fetchTimestamp + ONE_MINUTE_IN_MILLISECONDS) > now;
    const isFetchTimeLessThanTenSecondsAgo = (fetchTimestamp + TEN_SECONDS_IN_MILLISECONDS) > now;
    let cachedUser;

    if (!isDefinedFetchTimestamp) {
      cachedUser = this.core.globalStorage.get<ApiVscodeUser>("user");

      if (cachedUser) {
        Object.assign(this, cachedUser);

        this.core.emit("vscode", this.core, this);

        if (isFetchTimeLessThanOneMinuteAgo) return this;
      }
    }

    if (!isInternal && isFetchTimeLessThanTenSecondsAgo) return this;

    const method: keyof typeof this.core.api = isInternal ? "queueGet" : "get";

    const response = await this.core.api[method]<RESTGetApiVscode>("/vscode");

    if (!response) return this;

    if ("user" in response) {
      await this.core.globalStorage.update("user", response.user);

      Object.assign(this, response.user);

      this.core.emit("vscode", this.core, this);
    }

    return this;
  }

  async setLocale(locale: string) {
    const response = await this.core.api.put<RESTPutApiLocaleResult>(Routes.locale(locale));
    if (!response) return null;

    if ("locale" in response)
      this.locale = response.locale;

    return "body" in response ?
      <RESTPutApiLocaleResult>response.body :
      response;
  }
}
