import { t } from "@vscode/l10n";
import { authentication, type AuthenticationProvider, type AuthenticationProviderAuthenticationSessionsChangeEvent, type AuthenticationProviderSessionOptions, type AuthenticationSession, type AuthenticationSessionAccountInformation, EventEmitter } from "vscode";
import type ExtensionCore from "../core/extension";
import { GlobalStorageKeys } from "../utils/constants";
import { AuthenticationProviderId } from "./enum/providers";
import { type IPatAuthenticationProvider } from "./interfaces/pat";
import DiscloudPatAuthenticationProvider from "./pat/provider";

export default class AuthenticationProviderContainer implements AuthenticationProvider {
  constructor(
    readonly core: ExtensionCore,
  ) {
    const providerIds = Object.values(AuthenticationProviderId);

    for (let i = 0; i < providerIds.length; i++) {
      const providerId = providerIds[i];
      core.context.subscriptions.push(
        authentication.registerAuthenticationProvider(
          providerId,
          t(`authentication.provider.${providerId}.label`),
          this,
        ),
      );
    }

    this._pat = new DiscloudPatAuthenticationProvider(this._emitter, core.secrets, core.globalStorage);

    core.context.subscriptions.push(this._emitter);
  }

  protected readonly _pat: IPatAuthenticationProvider;

  protected readonly _emitter = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  /** @override {@link AuthenticationSession} */
  get onDidChangeSessions() { return this._emitter.event; }

  protected _getCurrentAuthenticationProviderId() {
    return this.core.globalStorage.get<AuthenticationProviderId>(GlobalStorageKeys.currentAutenticationProviderId);
  }

  protected _getCurrentSessionId() {
    return this.core.globalStorage.get<string>(GlobalStorageKeys.currentSessionId);
  }

  protected _getCurrentSessionAccount(): AuthenticationSessionAccountInformation | undefined {
    const sessionId = this._getCurrentSessionId();
    if (!sessionId) return;
    return this.core.globalStorage.get(sessionId);
  }

  /** @override {@link AuthenticationSession} */
  createSession(scopes: readonly string[], options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession> {
    return this._pat.createSession(scopes, options);
  }

  /** @override {@link AuthenticationSession} */
  getSessions(scopes: readonly string[] | undefined, options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession[]> {
    return this._pat.getSessions(scopes, options);
  }

  /** @override {@link AuthenticationSession} */
  removeSession(sessionId: string): Thenable<void> {
    return this._pat.removeSession(sessionId);
  }

  getSession(account?: AuthenticationSessionAccountInformation): Thenable<AuthenticationSession | undefined> {
    return this._pat.getSession(account);
  }

  clearSession(account?: AuthenticationSessionAccountInformation): Thenable<void> {
    return this._pat.clearSession(account);
  }

  validate(session: AuthenticationSession) {
    return this._pat.validate(session);
  }
}
