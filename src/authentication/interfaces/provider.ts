import type { AuthenticationProvider, AuthenticationSession, AuthenticationSessionAccountInformation } from "vscode";

export interface IAuthenticationProvider extends AuthenticationProvider {
  clearSession(account?: AuthenticationSessionAccountInformation): Thenable<void>
  getSession(account?: AuthenticationSessionAccountInformation): Thenable<AuthenticationSession | undefined>
  hasSession(): Thenable<boolean>
  validate(session: AuthenticationSession): Thenable<void>
}
