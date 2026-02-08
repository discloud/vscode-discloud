import { type Disposable } from "vscode";

const maxTimerDelay = 2147483647;

export interface TimerMapOptions {
  /** @default true */
  autoUnref?: boolean
}

export default class TimerMap<K, V extends NodeJS.Timeout = NodeJS.Timeout> extends Map<K, V> implements Disposable {
  constructor(iterable?: Iterable<readonly [K, V]> | null, options?: TimerMapOptions)
  constructor(entries?: readonly (readonly [K, V])[] | null, options?: TimerMapOptions)
  constructor(entries?: any, options?: TimerMapOptions) {
    super(entries);

    this.autoUnref = options?.autoUnref ?? true;
  }

  /**
   * When `true`, the active `Timeout` object will not require the Node.js event loop to remain active.
   * If there is no other activity keeping the event loop running, the process may terminate before
   * the `Timeout` object's callback is invoked.
   */
  declare autoUnref: boolean;

  clearTimeout(key: K) {
    clearTimeout(super.get(key));
  }

  dispose(): void;
  dispose(key: K): boolean;
  dispose(key?: K) {
    if (key !== undefined) {
      clearTimeout(super.get(key));
      return super.delete(key);
    }

    for (const timer of super.values()) clearTimeout(timer);

    super.clear();
  }

  refTimeout(key: K) {
    return this.get(key)?.ref();
  }

  refreshTimeout(key: K) {
    return this.get(key)?.refresh();
  }

  set(key: K, timeout: V): this {
    this.clearTimeout(key);
    return super.set(key, timeout);
  }

  setTimeout(key: K, callback: () => unknown, delay: number = 0): void {
    this.clearTimeout(key);

    if (delay > maxTimerDelay) return this._autoRefresh(key, callback, delay);

    const timer = setTimeout(callback, delay);
    if (this.autoUnref) timer.unref();
    super.set(key, timer as V);
  }

  unrefTimeout(key: K) {
    return this.get(key)?.ref();
  }

  protected _autoRefresh(key: K, callback: () => unknown, delay: number) {
    const timer = setTimeout(() => {
      delay -= maxTimerDelay;
      if (delay > maxTimerDelay) return timer.refresh();
      this.setTimeout(key, callback, delay);
    }, maxTimerDelay);

    if (this.autoUnref) timer.unref();
    super.set(key, timer as V);
  }
}
