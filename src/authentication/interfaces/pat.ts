import { type AuthenticationProvider, type AuthenticationSession } from "vscode";

export interface IPatAuthenticationProvider extends AuthenticationProvider {
  getSession(): Thenable<AuthenticationSession | undefined>
  removeSession(): Thenable<void>
  validate(session: AuthenticationSession): Thenable<void>
}
