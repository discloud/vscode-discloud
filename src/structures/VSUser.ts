import { type RESTPutApiLocaleResult, Routes } from "discloud.app";
import { type ApiVscodeApp, type ApiVscodeUser, type RESTGetApiVscode } from "../@types";
import core from "../extension";

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

  async fetch(isInternal?: boolean) {
    const method = isInternal ? "queueGet" : "get";

    const response = await core.api[method]<RESTGetApiVscode>("/vscode");

    if (!response) return this;

    if ("user" in response) {
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
