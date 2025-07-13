import type vscode from "vscode";
import { SecretKeys } from "../../utils/constants";

export default class SecretStorage implements vscode.SecretStorage, vscode.Disposable {
  constructor(protected readonly secrets: vscode.SecretStorage) {
    this.onDidChange = secrets.onDidChange.bind(secrets);
  }

  readonly #cache = new Map<string, string>();

  dispose() {
    this.#cache.clear();
  }

  delete(key: string): Thenable<void> {
    this.#cache.delete(key);
    return this.secrets.delete(key);
  }

  get(key: string): Thenable<string | undefined>
  get(key: string) {
    return this.#cache.get(key) ?? this.secrets.get(key);
  }

  onDidChange: vscode.Event<vscode.SecretStorageChangeEvent>;

  store(key: string, value: string): Thenable<void> {
    this.#cache.set(key, value);
    return this.secrets.store(key, value);
  }

  getToken() {
    return this.get(SecretKeys.token);
  }

  setToken(token?: string | null) {
    if (token) return this.store(SecretKeys.token, token);
    return this.delete(SecretKeys.token);
  }
}
