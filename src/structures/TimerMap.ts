import { type Disposable } from "vscode";

const timerDelayLimit = 2147483647;

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

  setTimeout(key: K, callback: () => unknown, delay?: number): void {
    if (typeof delay === "number" && delay > timerDelayLimit) {
      const timer = setTimeout(() => this.setTimeout(key, callback, delay - timerDelayLimit), timerDelayLimit);
      if (this.autoUnref) timer.unref();
      this.set(key, timer as V);
      return;
    }

    const timer = setTimeout(callback, delay);
    if (this.autoUnref) timer.unref();
    this.set(key, timer as V);
  }

  unrefTimeout(key: K) {
    return this.get(key)?.ref();
  }
}
