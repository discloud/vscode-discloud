import { type RESTPutApiLocaleResult, Routes } from "@discloudapp/api-types/v2";
import { type ApiVscodeApp, type ApiVscodeUser, type RESTGetApiVscode } from "../@types";
import core from "../extension";
import { GlobalStorageKeys, ONE_MINUTE_IN_MILLISECONDS, TEN_SECONDS_IN_MILLISECONDS } from "../utils/constants";

export default class VSUser implements ApiVscodeUser {
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
    return core.globalStorage.upsert<number>(GlobalStorageKeys.fetchUserTimestamp, currentTimestampValue);
  }

  async fetch(isInternal?: boolean) {
    const now = Date.now();
    const isDefinedFetchTimestamp = typeof this.#fetchTimestamp === "number";
    const fetchTimestamp = this.#fetchTimestamp = await this.#upsertFetchTimestamp(now);
    const isFetchTimeLessThanOneMinuteAgo = (fetchTimestamp + ONE_MINUTE_IN_MILLISECONDS) > now;
    const isFetchTimeLessThanTenSecondsAgo = (fetchTimestamp + TEN_SECONDS_IN_MILLISECONDS) > now;
    let cachedUser;

    if (!isDefinedFetchTimestamp) {
      cachedUser = core.globalStorage.get<ApiVscodeUser>("user");

      if (cachedUser) {
        Object.assign(this, cachedUser);

        core.emit("vscode", this);

        if (isFetchTimeLessThanOneMinuteAgo) return this;
      }
    }

    if (!isInternal && isFetchTimeLessThanTenSecondsAgo) return this;

    const method: keyof typeof core.api = isInternal ? "queueGet" : "get";

    const response = await core.api[method]<RESTGetApiVscode>("/vscode");

    if (!response) return this;

    if ("user" in response) {
      await core.globalStorage.update("user", response.user);

      Object.assign(this, response.user);

      core.emit("vscode", this);
    }

    return this;
  }

  async setLocale(locale: string) {
    const response = await core.api.put<RESTPutApiLocaleResult>(Routes.locale(locale));
    if (!response) return null;

    if ("locale" in response)
      this.locale = response.locale;

    return "body" in response ?
      <RESTPutApiLocaleResult>response.body :
      response;
  }
}
