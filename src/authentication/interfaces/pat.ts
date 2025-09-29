import { type AuthenticationProvider, type AuthenticationSession } from "vscode";

export interface IPatAuthenticationProvider extends AuthenticationProvider {
  getSession(): Thenable<AuthenticationSession | undefined>
  validate(session: AuthenticationSession): Thenable<void>
}
