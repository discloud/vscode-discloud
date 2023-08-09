import { RESTPutApiLocaleResult, Routes } from "discloud.app";
import { ApiVscodeApp, RESTGetApiVscode } from "../@types";
import extension from "../extension";
import { requester } from "../util";

export default class VSUser {
  apps: string[] = [];
  appsStatus: ApiVscodeApp[] = [];
  appsTeam: string[] = [];
  customdomains: string[] = [];
  subdomains: string[] = [];
  declare locale: string;
  declare plan: string;
  declare ramUsedMb: number;
  declare totalRamMb: number;
  declare userID: string;
  declare username: string;

  constructor() { }

  async fetch(isVS?: boolean) {
    const res = await requester<RESTGetApiVscode>("/vscode", {
      headersTimeout: 60000,
    }, isVS);
    if (!res) return;

    if ("user" in res)
      Object.assign(this, res.user);

    extension.emit("vscode", this);

    return this;
  }

  async setLocale(locale: string) {
    const res = await requester<RESTPutApiLocaleResult>(Routes.locale(locale), {
      method: "PUT",
    });

    if ("locale" in res)
      this.locale = res.locale;

    return "body" in res ?
      <RESTPutApiLocaleResult>res.body :
      res;
  }
}
