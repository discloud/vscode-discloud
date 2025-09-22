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

  /**
   * Store the current value and return the previous value.
   * if it does not contain a saved value, the current value will be returned
   * The value must be JSON-stringifyable.
   * 
   * *Note* that using `undefined` as value removes the key from the underlying storage.
   * 
   * @param currentValue A value. MUST not contain cyclic references.
   */
  upsert<T>(key: string, currentValue: T): Thenable<T>
  async upsert<T>(key: string, currentValue: T) {
    const cached = this.state.get<T>(key);
    await this.state.update(key, currentValue);
    if (typeof cached === typeof currentValue) return cached;
    return currentValue;
  }

  update<T>(key: string, value: T) {
    return this.state.update(key, value);
  }

  delete(key: string) {
    return this.state.update(key, undefined);
  }
}