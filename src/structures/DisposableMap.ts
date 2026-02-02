import { type Disposable } from "vscode";

export default class DisposableMap<K, V extends Disposable> extends Map<K, V> implements Disposable {
  dispose(): void;
  dispose(key: K, onError?: (error: unknown) => void): boolean;
  dispose(key?: K, onError?: (error: unknown) => void): boolean;
  dispose(key?: K, onError?: (error: unknown) => void) {
    if (key === undefined) {
      for (const disposable of this.values()) {
        try { disposable.dispose(); }
        catch (error) { onError?.(error); }
      }
      this.clear();
    } else {
      const existing = this.get(key);
      if (existing) {
        try { existing.dispose(); }
        catch (error) { onError?.(error); }
        return this.delete(key);
      }
      return false;
    }
  }
}
