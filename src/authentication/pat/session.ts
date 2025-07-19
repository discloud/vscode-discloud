import { type AuthenticationSession, type AuthenticationSessionAccountInformation } from "vscode";
import { SecretKeys } from "../../utils/constants";

export default class DiscloudPatAuthenticationSession implements AuthenticationSession {
  constructor(
    readonly accessToken: string,
    readonly account: AuthenticationSessionAccountInformation,
  ) { }

  readonly id = SecretKeys.discloudpat;

  readonly scopes: readonly string[] = [];
}
