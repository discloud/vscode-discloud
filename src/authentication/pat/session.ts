import { type AuthenticationSession, type AuthenticationSessionAccountInformation } from "vscode";

export default class DiscloudPatAuthenticationSession implements AuthenticationSession {
  constructor(
    readonly id: string,
    readonly accessToken: string,
    readonly account: AuthenticationSessionAccountInformation,
  ) { }

  readonly scopes: readonly string[] = [];
}
