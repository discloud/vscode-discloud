import { type AuthenticationSession, type AuthenticationSessionAccountInformation } from "vscode";
import { SecretKeys } from "../../utils/constants";

export default class DiscloudPatAuthenticationSession implements AuthenticationSession {
  constructor(readonly accessToken: string) { }

  readonly id = SecretKeys.discloudpat;

  readonly account: AuthenticationSessionAccountInformation = {
    id: SecretKeys.discloudpat,
    label: "Personal Access Token",
  };

  readonly scopes: readonly string[] = [];
}
