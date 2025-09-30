import { type AuthenticationProvider, type AuthenticationSession, type AuthenticationSessionAccountInformation } from "vscode";

export interface IPatAuthenticationProvider extends AuthenticationProvider {
  clearSession(account?: AuthenticationSessionAccountInformation): Thenable<void>
  getSession(account?: AuthenticationSessionAccountInformation): Thenable<AuthenticationSession | undefined>
  validate(session: AuthenticationSession): Thenable<void>
}
