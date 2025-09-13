import type vscode from "vscode";

export default class SecretStorage implements vscode.SecretStorage, vscode.Disposable {
  constructor(
    protected readonly secrets: vscode.SecretStorage,
  ) {
    this.onDidChange = secrets.onDidChange.bind(secrets);
  }

  readonly #cache = new Map<string, string>();

  dispose() {
    this.#cache.clear();
  }

  delete(key: string) {
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
}
