import { type Disposable } from "vscode";

export default class DisposableMap<K, V extends Disposable> extends Map<K, V> implements Disposable {
  dispose(): void;
  dispose(key: K, onError?: (error: unknown) => void): boolean;
  dispose(key?: K, onError?: (error: unknown) => void): boolean;
  dispose(key?: K, onError?: (error: unknown) => void) {
    if (key !== undefined) {
      const existing = super.get(key);

      if (existing) {
        try { existing.dispose(); }
        catch (error) { onError?.(error); }
        return super.delete(key);
      }

      return false;
    }

    for (const disposable of super.values()) {
      try { disposable.dispose(); }
      catch (error) { onError?.(error); }
    }

    super.clear();
  }
}
