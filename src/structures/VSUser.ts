import { type RESTPutApiLocaleResult, Routes } from "discloud.app";
import { type ApiVscodeApp, type ApiVscodeUser, type RESTGetApiVscode } from "../@types";
import extension from "../extension";

export default class VSUser implements ApiVscodeUser {
  readonly apps: string[] = [];
  readonly appsStatus: ApiVscodeApp[] = [];
  readonly appsTeam: string[] = [];
  readonly customdomains: string[] = [];
  readonly subdomains: string[] = [];
  declare locale: string;
  declare readonly plan: string;
  declare readonly planDataEnd: string;
  declare readonly ramUsedMb: number;
  declare readonly totalRamMb: number;
  declare readonly userID: string;
  declare readonly userName: string;

  async fetch(isVS?: boolean) {
    const method = isVS ? "queueGet" : "get";

    const res = await extension.api[method]<RESTGetApiVscode>("/vscode");

    if (!res) return this;

    if ("user" in res) {
      Object.assign(this, res.user);

      extension.emit("vscode", this);
    }

    return this;
  }

  async setLocale(locale: string) {
    const res = await extension.api.put<RESTPutApiLocaleResult>(Routes.locale(locale));
    if (!res) return null;

    if ("locale" in res)
      this.locale = res.locale;

    return "body" in res ?
      <RESTPutApiLocaleResult>res.body :
      res;
  }
}
