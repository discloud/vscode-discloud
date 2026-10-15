import { t } from "@vscode/l10n";
import { authentication, type AuthenticationProviderAuthenticationSessionsChangeEvent, type AuthenticationProviderSessionOptions, type AuthenticationSession, type AuthenticationSessionAccountInformation, EventEmitter } from "vscode";
import type ExtensionCore from "../core";
import { GlobalStorageKeys } from "../utils/constants";
import { AuthenticationProviderId } from "./enum/providers";
import type { IAuthenticationProvider } from "./interfaces/provider";
import DiscloudPatAuthenticationProvider from "./providers/pat";

export default class DiscloudAuthenticationProvider implements IAuthenticationProvider {
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

  declare protected readonly _pat: IAuthenticationProvider;

  protected readonly _emitter = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  /** @override {@link AuthenticationProvider} */
  get onDidChangeSessions() { return this._emitter.event; }

  protected get _globalStorage() { return this.core.globalStorage; }

  protected _getCurrentAuthenticationProviderId() {
    return this._globalStorage.get<AuthenticationProviderId>(GlobalStorageKeys.currentAutenticationProviderId);
  }

  protected _getCurrentSessionId() {
    return this._globalStorage.get<string>(GlobalStorageKeys.currentSessionId);
  }

  protected _getCurrentSessionAccount(): AuthenticationSessionAccountInformation | undefined {
    const sessionId = this._getCurrentSessionId();
    if (sessionId) return this._globalStorage.get(sessionId);
  }

  /** @override {@link AuthenticationProvider} */
  createSession(scopes: readonly string[], options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession> {
    return this._pat.createSession(scopes, options);
  }

  /** @override {@link AuthenticationProvider} */
  getSessions(scopes: readonly string[] | undefined, options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession[]> {
    return this._pat.getSessions(scopes, options);
  }

  /** @override {@link AuthenticationProvider} */
  removeSession(sessionId: string): Thenable<void> {
    return this._pat.removeSession(sessionId);
  }

  clearSession(account?: AuthenticationSessionAccountInformation): Thenable<void> {
    return this._pat.clearSession(account);
  }

  getSession(account?: AuthenticationSessionAccountInformation): Thenable<AuthenticationSession | undefined> {
    return this._pat.getSession(account);
  }

  hasSession() {
    return this._pat.hasSession();
  }

  validate(session: AuthenticationSession) {
    return this._pat.validate(session);
  }
}
