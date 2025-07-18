import { t } from "@vscode/l10n";
import { RouteBases, Routes } from "discloud.app";
import { authentication, type AuthenticationProviderAuthenticationSessionsChangeEvent, type AuthenticationProviderSessionOptions, type AuthenticationSession, type Event, EventEmitter, type ExtensionContext, type SecretStorage, window } from "vscode";
import { tokenIsDiscloudJwt } from "../../services/discloud/utils";
import { SecretKeys } from "../../utils/constants";
import { UnauthorizedError } from "../errors/unauthorized";
import { UnknownError } from "../errors/unknown";
import { type IPatAuthenticationProvider } from "../interfaces/pat";
import DiscloudPatAuthenticationSession from "./session";

const providerId = "discloud";
const providerLabel = "Discloud Personal Access Token";
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

        if ((await oldSession)?.accessToken === value)
          return t("input.same.previous");
      },
    });

    if (!input) throw Error(t("invalid.input"));

    await this.secrets.store(secretKey, input);

    const newSession = new DiscloudPatAuthenticationSession(input);

    this._fire(await oldSession ? { changed: [newSession] } : { added: [newSession] });

    return newSession;
  }

  getSessions(scopes: readonly string[] | undefined, options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession[]>
  async getSessions(_scopes: readonly string[] | undefined, _options: AuthenticationProviderSessionOptions) {
    const secret = await this.secrets.get(secretKey);

    return secret ? [new DiscloudPatAuthenticationSession(secret)] : [];
  }

  async removeSession() {
    const session = await this.getSession();
    if (!session) return;

    await this.secrets.delete(secretKey);

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

    switch (response.status) {
      case 401:
        throw new UnauthorizedError();

      default:
        throw new UnknownError();
    }
  }
}
