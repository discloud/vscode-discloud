import { ApiVscodeApp, RESTGetApiVscode } from "../@types";
import extension from "../extension";
import { requester } from "../util";
import Discloud from "./Discloud";

export default class VSUser {
  apps: string[] = [];
  appsStatus: ApiVscodeApp[] = [];
  appsTeam: string[] = [];
  customdomains: string[] = [];
  locale?: string;
  plan?: string;
  ramUsedMb?: number;
  subdomains: string[] = [];
  totalRamMb?: number;
  userID?: string;

  constructor(protected readonly discloud: Discloud) { }

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
}