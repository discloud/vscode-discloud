import { type RESTGetApiUserResult, RouteBases, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { setTimeout as sleep } from "timers/promises";
import { authentication, type AuthenticationProviderAuthenticationSessionsChangeEvent, type AuthenticationProviderSessionOptions, type AuthenticationSession, type AuthenticationSessionAccountInformation, EventEmitter, type ExtensionContext, type SecretStorage, window } from "vscode";
import { tokenIsDiscloudJwt } from "../../services/discloud/utils";
import { SecretKeys } from "../../utils/constants";
import BaseAuthenticationError from "../errors/base";
import UnauthorizedError from "../errors/unauthorized";
import { type IPatAuthenticationProvider } from "../interfaces/pat";
import { hash } from "../utils/hash";
import DiscloudPatAuthenticationSession from "./session";

const providerId = "discloud";
const providerLabel = "Discloud";
const defaultSessionAccount = { id: "Discloud User ID", label: "Discloud User" };
const sessionIdListKey = "sessionIdList";

export default class DiscloudPatAuthenticationProvider implements IPatAuthenticationProvider {
  constructor(
    protected readonly context: ExtensionContext,
    protected readonly secrets: SecretStorage,
  ) {
    const disposable = authentication.registerAuthenticationProvider(providerId, providerLabel, this);

    this.context.subscriptions.push(disposable, this._onDidChangeSessions);
  }

  protected readonly _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();

  get onDidChangeSessions() { return this._onDidChangeSessions.event; }

  protected _fire(data: Partial<AuthenticationProviderAuthenticationSessionsChangeEvent>): void
  protected _fire(data: AuthenticationProviderAuthenticationSessionsChangeEvent) {
    this._onDidChangeSessions.fire(data);
  }

  createSession(scopes: readonly string[], options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession>
  async createSession(_scopes: readonly string[], options: AuthenticationProviderSessionOptions) {
    const oldSession = this.getSession(options.account);

    const input = await window.showInputBox({
      ignoreFocusOut: true,
      password: true,
      prompt: t("input.login.prompt"),
      async validateInput(value: string) {
        if (!tokenIsDiscloudJwt(value))
          return t("input.login.prompt");

        const maybeOldSession = await Promise.race([oldSession, sleep(100)]);

        if (!maybeOldSession) return;

        if (maybeOldSession.accessToken === value)
          return t("input.same.previous");
      },
    });

    if (!input) throw Error(t("cancelled"));

    const url = new URL(`${RouteBases.api}${Routes.user()}`);

    const response = await fetch(url, { headers: { "api-token": input } });

    if (!response.ok) throw await BaseAuthenticationError.fromStatusCode(response.status);

    const newSessionId = SecretKeys.discloudpat; //`session.pat.${Date.now()}`;

    const sessionIdList = this.context.globalState.get<string[]>(sessionIdListKey, []);
    sessionIdList.push(newSessionId);

    const sessionIdSet = new Set(sessionIdList);

    const body = await response.json() as RESTGetApiUserResult;

    const account: AuthenticationSessionAccountInformation = {
      id: body.user.userID ?? defaultSessionAccount.id,
      label: body.user.username ?? body.user.userID ?? defaultSessionAccount.label,
    };

    await Promise.all([
      this.context.globalState.update(sessionIdListKey, Array.from(sessionIdSet)),
      this.context.globalState.update(newSessionId, account),
      this.secrets.store(newSessionId, input),
    ]);

    const newSession = new DiscloudPatAuthenticationSession(newSessionId, input, account);

    const maybeOldSession = await Promise.race([oldSession, sleep(100)]);

    this._fire(maybeOldSession ? { changed: [newSession] } : { added: [newSession] });

    return newSession;
  }

  getSessions(scopes: readonly string[] | undefined, options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession[]>
  async getSessions(_scopes: readonly string[] | undefined, options: AuthenticationProviderSessionOptions) {
    const sessionIdList = this.context.globalState.get<string[]>(sessionIdListKey, [SecretKeys.discloudpat]);
    const sessionIdSet = new Set(sessionIdList);

    const sessions: DiscloudPatAuthenticationSession[] = [];

    for (let i = 0; i < sessionIdList.length; i++) {
      const sessionId = sessionIdList[i];

      const secret = await this.secrets.get(sessionId);
      if (!secret) {
        sessionIdSet.delete(sessionId);
        continue;
      }

      const account: AuthenticationSessionAccountInformation
        = this.context.globalState.get(sessionId)
        ?? this.context.globalState.get(hash(secret))
        ?? defaultSessionAccount;

      if (options.account && options.account.id !== account.id) continue;

      const session = new DiscloudPatAuthenticationSession(sessionId, secret, account);

      sessions.push(session);
    }

    if (sessionIdList.length !== sessionIdSet.size)
      await this.context.globalState.update(sessionIdListKey, Array.from(sessionIdSet));

    return sessions;
  }

  async removeSession(sessionId: string) {
    const secret = await this.secrets.get(sessionId);
    if (!secret) return;

    const secretHash = hash(secret);

    const account: AuthenticationSessionAccountInformation
      = this.context.globalState.get(sessionId)
      ?? this.context.globalState.get(secretHash)
      ?? defaultSessionAccount;

    const session = new DiscloudPatAuthenticationSession(sessionId, secret, account);

    await this.secrets.delete(sessionId);

    await this.context.globalState.update(sessionId, undefined);
    await this.context.globalState.update(secretHash, undefined);

    this._fire({ removed: [session] });
  }

  async clearSession(account?: AuthenticationSessionAccountInformation) {
    const session = await authentication.getSession(providerId, [], { account, silent: true });
    if (session) this.removeSession(session.id);
  }

  async getSession(account?: AuthenticationSessionAccountInformation) {
    return authentication.getSession(providerId, [], { account, silent: true });
  }

  async validate(session: AuthenticationSession) {
    if (!tokenIsDiscloudJwt(session.accessToken)) throw new UnauthorizedError();

    const url = new URL(`${RouteBases.api}${Routes.user()}`);

    const response = await fetch(url, { headers: { "api-token": session.accessToken } });

    if (response.ok) return;

    throw await BaseAuthenticationError.fromStatusCode(response.status);
  }
}
