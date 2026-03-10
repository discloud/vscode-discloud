import type vscode from "vscode";

export default class SecretStorage implements vscode.SecretStorage {
  constructor(
    protected readonly secrets: vscode.SecretStorage,
  ) {
    this.onDidChange = secrets.onDidChange.bind(secrets);
  }

  delete(key: string) {
    return this.secrets.delete(key);
  }

  get(key: string): Thenable<string | undefined>
  get(key: string) {
    return this.secrets.get(key);
  }

  keys(): Thenable<string[]> {
    return this.secrets.keys();
  }

  declare onDidChange: vscode.Event<vscode.SecretStorageChangeEvent>;

  store(key: string, value: string): Thenable<void> {
    return this.secrets.store(key, value);
  }
}
