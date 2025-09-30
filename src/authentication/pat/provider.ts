import { type RESTGetApiUserResult, RouteBases, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { setTimeout as sleep } from "timers/promises";
import { authentication, type AuthenticationProviderAuthenticationSessionsChangeEvent, type AuthenticationProviderSessionOptions, type AuthenticationSession, type AuthenticationSessionAccountInformation, type Event, EventEmitter, type ExtensionContext, type SecretStorage, window } from "vscode";
import { tokenIsDiscloudJwt } from "../../services/discloud/utils";
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

    this.context.subscriptions.push(disposable);
  }

  protected readonly _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();

  get onDidChangeSessions(): Event<AuthenticationProviderAuthenticationSessionsChangeEvent> {
    return this._onDidChangeSessions.event;
  }

  protected _fire(data: Partial<AuthenticationProviderAuthenticationSessionsChangeEvent>): void
  protected _fire(data: AuthenticationProviderAuthenticationSessionsChangeEvent) {
    this._onDidChangeSessions.fire(data);
  }

  createSession(scopes: readonly string[], options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession>
  async createSession(_scopes: readonly string[], _options: AuthenticationProviderSessionOptions) {
    const oldSession = this.getSession();

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

    const newSessionId = `${Date.now()}`;

    const sessionIdList = this.context.globalState.get<string[]>(sessionIdListKey, []);
    sessionIdList.push(newSessionId);

    const sessionIdSet = new Set(sessionIdList);

    const body = await response.json() as RESTGetApiUserResult;

    const account: AuthenticationSessionAccountInformation = {
      id: body.user.userID ?? defaultSessionAccount.id,
      label: body.user.username ?? defaultSessionAccount.label,
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
  async getSessions(_scopes: readonly string[] | undefined, _options: AuthenticationProviderSessionOptions) {
    const sessionIdList = this.context.globalState.get<string[]>(sessionIdListKey, []);
    const sessionIdSet = new Set(sessionIdList);

    const sessions: DiscloudPatAuthenticationSession[] = [];

    await Promise.all(sessionIdList.map(async (sessionId) => {
      const secret = await this.secrets.get(sessionId);
      if (!secret) {
        sessionIdSet.delete(sessionId);
        return;
      }

      const account: AuthenticationSessionAccountInformation
        = this.context.globalState.get(sessionId)
        ?? this.context.globalState.get(hash(secret))
        ?? defaultSessionAccount;

      const session = new DiscloudPatAuthenticationSession(sessionId, secret, account);

      sessions.push(session);
    }));

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

  getSession() {
    return authentication.getSession(providerId, [], { silent: true });
  }

  async validate(session: AuthenticationSession) {
    if (!tokenIsDiscloudJwt(session.accessToken)) throw new UnauthorizedError();

    const url = new URL(`${RouteBases.api}${Routes.user()}`);

    const response = await fetch(url, { headers: { "api-token": session.accessToken } });

    if (response.ok) return;

    throw await BaseAuthenticationError.fromStatusCode(response.status);
  }
}
