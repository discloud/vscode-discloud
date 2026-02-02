import { type Disposable } from "vscode";

export default class DisposableMap<K, V extends Disposable> extends Map<K, V> implements Disposable {
  dispose(): void;
  dispose(key: K): boolean;
  dispose(key?: K) {
    if (key === undefined) {
      for (const disposable of this.values()) {
        try {
          disposable.dispose?.();
        } catch (error) {
          console.error("Error disposing item:", error);
        }
      }
      this.clear();
    } else {
      const existing = this.get(key);
      if (existing) {
        try {
          existing.dispose?.();
        } catch (error) {
          console.error(`Error disposing item with key ${key}:`, error);
        }
        return this.delete(key);
      }
      return false;
    }
  }
}
