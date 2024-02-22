import { RESTPutApiLocaleResult, Routes } from "discloud.app";
import { ApiVscodeApp, ApiVscodeUser, RESTGetApiVscode } from "../@types";
import extension from "../extension";
import { requester } from "../util";

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
  declare readonly username: string;

  constructor() { }

  async fetch(isVS?: boolean) {
    const res = await requester<RESTGetApiVscode>("/vscode", {}, isVS);

    if (!res) return this;

    if ("user" in res) {
      Object.assign(this, res.user);

      extension.emit("vscode", this);
    }

    return this;
  }

  async setLocale(locale: string) {
    const res = await requester<RESTPutApiLocaleResult>(Routes.locale(locale), {
      method: "PUT",
    });
    if (!res) return null;

    if ("locale" in res)
      this.locale = res.locale;

    return "body" in res ?
      <RESTPutApiLocaleResult>res.body :
      res;
  }
}
