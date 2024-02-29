import { type Disposable } from "vscode";

export default class DisposableMap<K, V extends Disposable> extends Map<K, V> {
  dispose(): void;
  dispose(key: K): boolean;
  dispose(key?: K) {
    if (key === undefined) {
      for (const disposable of this.values()) {
        disposable.dispose();
      }
      this.clear();
    } else {
      const existing = this.get(key);

      if (existing) {
        existing.dispose();
        return this.delete(key);
      }

      return false;
    }
  }
}
