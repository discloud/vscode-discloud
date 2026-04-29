import { type RESTGetApiUserResult, RouteBases, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { authentication, type AuthenticationProvider, type AuthenticationProviderAuthenticationSessionsChangeEvent, type AuthenticationProviderSessionOptions, type AuthenticationSession, type AuthenticationSessionAccountInformation, type EventEmitter, type SecretStorage, window } from "vscode";
import { type IGlobalStateStorage } from "../../@types";
import { tokenIsDiscloudJwt } from "../../services/discloud/utils";
import { GlobalStorageKeys } from "../../utils/constants";
import { AuthenticationProviderId } from "../enum/providers";
import BaseAuthenticationError from "../errors/base";
import UnauthorizedError from "../errors/unauthorized";
import { type IPatAuthenticationProvider } from "../interfaces/pat";
import DiscloudAuthenticationSession from "../session";

const providerId = AuthenticationProviderId.discloud;
const defaultSessionAccount: AuthenticationSessionAccountInformation
  = { id: "Unknown Discloud User ID", label: "Unknown Discloud User" };

export default class DiscloudPatAuthenticationProvider implements IPatAuthenticationProvider, AuthenticationProvider {
  constructor(
    protected readonly emitter: EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>,
    protected readonly secrets: SecretStorage,
    protected readonly storage: IGlobalStateStorage,
  ) { }

  get onDidChangeSessions() { return this.emitter.event; }

  protected _fire(data: Partial<AuthenticationProviderAuthenticationSessionsChangeEvent>): void
  protected _fire(data: AuthenticationProviderAuthenticationSessionsChangeEvent) {
    this.emitter.fire(data);
  }

  /** @override {@link AuthenticationProvider} */
  createSession(scopes: readonly string[], options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession>
  async createSession(_scopes: readonly string[], _options: AuthenticationProviderSessionOptions) {
    const sessionIdList = this.storage.get<string[]>(GlobalStorageKeys.sessionIdList, []);

    const currentTokens = new Set<string>();
    for (let i = 0; i < sessionIdList.length; i++) {
      const sessionId = sessionIdList[i];
      const maybeToken = await this.secrets.get(sessionId);
      if (maybeToken) currentTokens.add(maybeToken);
    }

    const input = await window.showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: t("input.login.prompt"),
      async validateInput(value: string) {
        if (!tokenIsDiscloudJwt(value))
          return t("input.login.prompt");

        if (currentTokens.has(value))
          return t("input.same.previous");
      },
    });

    if (!input) throw Error(t("cancelled"));

    const url = new URL(`${RouteBases.api}${Routes.user()}`);

    const response = await fetch(url, { headers: { "api-token": input } });

    if (!response.ok) throw await BaseAuthenticationError.fromStatusCode(response.status);

    const body = await response.json() as RESTGetApiUserResult;

    const account: AuthenticationSessionAccountInformation = {
      id: body.user.userID ?? defaultSessionAccount.id,
      label: body.user.username ?? body.user.userID ?? defaultSessionAccount.label,
    };

    const newSessionId = `${providerId}.${account.id}`;

    const sessionIdSet = new Set(sessionIdList);

    sessionIdSet.add(newSessionId);

    const oldSessionId = this.storage.get<string>(GlobalStorageKeys.currentSessionId);
    if (oldSessionId) {
      sessionIdSet.delete(oldSessionId);
      await Promise.all([
        this.storage.update(oldSessionId, undefined),
        this.secrets.delete(oldSessionId),
      ]);
    }

    await Promise.all([
      this.storage.update(GlobalStorageKeys.sessionIdList, Array.from(sessionIdSet)),
      this.storage.update(GlobalStorageKeys.currentAutenticationProviderId, providerId),
      this.storage.update(GlobalStorageKeys.currentSessionId, newSessionId),
      this.storage.update(newSessionId, account),
      this.secrets.store(newSessionId, input),
    ]);

    const newSession = new DiscloudAuthenticationSession(newSessionId, input, account);

    this._fire(oldSessionId ? { changed: [newSession] } : { added: [newSession] });

    return newSession;
  }

  /** @override {@link AuthenticationProvider} */
  getSessions(scopes: readonly string[] | undefined, options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession[]>
  async getSessions(_scopes: readonly string[] | undefined, options: AuthenticationProviderSessionOptions) {
    const sessionIdList = this.storage.get<string[]>(GlobalStorageKeys.sessionIdList, []);
    const sessionIdSet = new Set(sessionIdList);

    const sessions: DiscloudAuthenticationSession[] = [];

    for (let i = 0; i < sessionIdList.length; i++) {
      const sessionId = sessionIdList[i];

      const secret = await this.secrets.get(sessionId);
      if (!secret) {
        sessionIdSet.delete(sessionId);
        continue;
      }

      const account: AuthenticationSessionAccountInformation
        = this.storage.get(sessionId) ?? defaultSessionAccount;

      if (options.account && options.account.id !== account.id) continue;

      const session = new DiscloudAuthenticationSession(sessionId, secret, account);

      sessions.push(session);
    }

    if (sessionIdList.length !== sessionIdSet.size)
      await this.storage.update(GlobalStorageKeys.sessionIdList, Array.from(sessionIdSet));

    return sessions;
  }

  /** @override {@link AuthenticationProvider} */
  removeSession(sessionId: string): Thenable<void>
  async removeSession(sessionId: string) {
    const secret = await this.secrets.get(sessionId);
    if (!secret) return;

    const account: AuthenticationSessionAccountInformation
      = this.storage.get(sessionId) ?? defaultSessionAccount;

    const session = new DiscloudAuthenticationSession(sessionId, secret, account);

    await this.secrets.delete(sessionId);

    await this.storage.update(sessionId, undefined);

    this._fire({ removed: [session] });
  }

  async clearSession(account?: AuthenticationSessionAccountInformation) {
    const session = await this.getSession(account);
    if (session) this.removeSession(session.id);
  }

  async getSession(account?: AuthenticationSessionAccountInformation) {
    return authentication.getSession(providerId, [], { account, silent: true });
  }

  async validate(session: AuthenticationSession) {
    if (!tokenIsDiscloudJwt(session.accessToken)) throw new UnauthorizedError();

    const url = new URL(`${RouteBases.api}${Routes.user()}`);

    const response = await fetch(url, { headers: { "api-token": session.accessToken } });

    if (response.ok) return; // Valid Session

    throw await BaseAuthenticationError.fromStatusCode(response.status);
  }
}
