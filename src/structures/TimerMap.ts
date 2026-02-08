import { type Disposable } from "vscode";

const maxTimerDelay = 2147483647;

export interface TimerMapOptions {
  /**
   * When `true`, the active `Timeout` object will not require the Node.js event loop to remain active.
   * If there is no other activity keeping the event loop running, the process may terminate before
   * the `Timeout` object's callback is invoked.
   * 
   * @default true
   */
  autoUnref?: boolean
}

export default class TimerMap<K, V extends NodeJS.Timeout = NodeJS.Timeout> extends Map<K, V> implements Disposable {
  constructor(
    entries?: readonly (readonly [K, V])[] | Iterable<readonly [K, V]> | null,
    options?: TimerMapOptions,
  ) {
    super(entries);

    this.autoUnref = options?.autoUnref ?? true;
  }

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

  /**
   * Schedules execution of a one-time `callback` after `delay` milliseconds.
   * 
   * The `delay` value can be greater than `2147483647`, and can be infinite.
   * 
   * When `delay` is less than `1` or `NaN`, the `delay` will be set to `1`.
   * Non-integer delays are truncated to an integer.
   * 
   * If `callback` is not a function, a `TypeError` will be thrown.
   * 
   * @param key 
   * @param callback The function to call when the timer elapses.
   * @param delay The number of milliseconds to wait before calling the callback. **Default**: 1.
   */
  setTimeout(key: K, callback: () => unknown, delay: number = 1): void {
    this.clearTimeout(key);

    if (delay > maxTimerDelay) return this._autoRefresh(key, callback, delay);

    const timer = setTimeout(callback, delay);
    if (this.autoUnref) timer.unref();
    super.set(key, timer as V);
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

  unrefTimeout(key: K) {
    return this.get(key)?.unref();
  }
}
