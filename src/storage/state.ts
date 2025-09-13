import type vscode from "vscode";

export default class StateStorage implements vscode.Memento {
  constructor(
    protected readonly state: vscode.Memento,
  ) { }

  keys() {
    return this.state.keys();
  }

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T) {
    return this.state.get<T>(key, defaultValue!);
  }

  upsert<T>(key: string, defaultValue: T): Thenable<T>
  async upsert<T>(key: string, defaultValue: T) {
    const cached = this.state.get<T>(key);
    if (typeof cached === typeof defaultValue) return cached;
    await this.state.update(key, defaultValue);
    return defaultValue;
  }

  update<T>(key: string, value: T) {
    return this.state.update(key, value);
  }

  delete(key: string) {
    return this.state.update(key, undefined);
  }
}