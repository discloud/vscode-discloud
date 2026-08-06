import type { Disposable } from "vscode";

const _maxTimerDelay = 2147483647;

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

export default class TimerMap<K = keyof any, T extends NodeJS.Timeout = NodeJS.Timeout> extends Map<K, T> implements Disposable {
  constructor(
    entries?: readonly (readonly [K, T])[] | Iterable<readonly [K, T]> | null,
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

  set(key: K, timeout: T): this {
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
  setTimeout(key: K, callback: () => void, delay: number = 1): void {
    this.clearTimeout(key);

    if (delay > _maxTimerDelay) return this.#autoRefresh(key, callback, delay);

    const timer = setTimeout(this.#wrapCallback(key, callback), delay);

    if (this.autoUnref) timer.unref();

    super.set(key, timer as T);
  }

  #autoRefresh(key: K, callback: () => void, delay: number) {
    const timer = setTimeout(() => {
      delay -= _maxTimerDelay;
      if (delay > _maxTimerDelay) return timer.refresh();
      this.setTimeout(key, callback, delay);
    }, _maxTimerDelay);

    if (this.autoUnref) timer.unref();

    super.set(key, timer as T);
  }

  #wrapCallback(key: K, callback: () => void) {
    return () => {
      super.delete(key);
      callback();
    };
  }

  unrefTimeout(key: K) {
    return super.get(key)?.unref();
  }
}
