import { type RESTGetApiUserResult, RouteBases, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { setTimeout as sleep } from "timers/promises";
import { authentication, type AuthenticationProviderAuthenticationSessionsChangeEvent, type AuthenticationProviderSessionOptions, type AuthenticationSession, type AuthenticationSessionAccountInformation, type Event, EventEmitter, type ExtensionContext, type SecretStorage, window } from "vscode";
import { tokenIsDiscloudJwt } from "../../services/discloud/utils";
import { SecretKeys } from "../../utils/constants";
import BaseAuthenticationError from "../errors/base";
import UnauthorizedError from "../errors/unauthorized";
import { type IPatAuthenticationProvider } from "../interfaces/pat";
import { hash } from "../utils/hash";
import DiscloudPatAuthenticationSession from "./session";

const providerId = "discloud";
const providerLabel = "Discloud Token";
const secretKey = SecretKeys.discloudpat;

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
      prompt: t("input.login.prompt"),
      password: true,
      validateInput: async (value: string) => {
        if (!tokenIsDiscloudJwt(value))
          return t("input.login.prompt");

        const maybeOldSession = await Promise.race([oldSession, sleep(100)]);

        if (!maybeOldSession) return;

        if (maybeOldSession.accessToken === value)
          return t("input.same.previous");
      },
    });

    if (!input) throw Error(t("invalid.input"));

    const url = new URL(`${RouteBases.api}${Routes.user()}`);

    const response = await fetch(url, { headers: { "api-token": input } });

    if (!response.ok) throw await BaseAuthenticationError.fromStatusCode(response.status);

    const body = await response.json() as RESTGetApiUserResult;

    const account: AuthenticationSessionAccountInformation = {
      id: body.user.userID ?? "Discloud User ID",
      label: body.user.username ?? "Discloud User",
    };

    const secretHash = hash(input);

    await this.context.globalState.update(secretHash, account);

    await this.secrets.store(secretKey, input);

    const newSession = new DiscloudPatAuthenticationSession(input, account);

    const maybeOldSession = await Promise.race([oldSession, sleep(100)]);

    this._fire(maybeOldSession ? { changed: [newSession] } : { added: [newSession] });

    return newSession;
  }

  getSessions(scopes: readonly string[] | undefined, options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession[]>
  async getSessions(_scopes: readonly string[] | undefined, _options: AuthenticationProviderSessionOptions) {
    const secret = await this.secrets.get(secretKey);

    if (!secret) return [];

    const secretHash = hash(secret);

    const account = this.context.globalState.get<AuthenticationSessionAccountInformation>(secretHash)
      ?? { id: "Discloud User ID", label: "Discloud User" };

    const session = new DiscloudPatAuthenticationSession(secret, account);

    return [session];
  }

  async removeSession() {
    const session = await this.getSession();
    if (!session) return;

    await this.secrets.delete(secretKey);

    const secretHash = hash(session.accessToken);

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
