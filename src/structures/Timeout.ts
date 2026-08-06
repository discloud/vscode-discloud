const _maxTimerDelay = 2147483647;

export default class Timeout implements NodeJS.Timeout {
  constructor(callback: () => unknown, delay: number = 1) {
    this.#callback = callback;
    this.#remain = this.#delay = delay;
    this.#start();
  }

  _onTimeout(...args: any[]): void {
    this.#timeout._onTimeout(...args);
  }

  #callback: () => unknown;
  #called!: boolean;
  #delay: number;
  #remain!: number;
  #timeout!: NodeJS.Timeout;

  #start() {
    this.#called = false;
    if (this.#remain > _maxTimerDelay) {
      this.#timeout = setTimeout(this.#autoRefreshCallback.bind(this), _maxTimerDelay).unref();
    } else {
      this.#timeout = setTimeout(this.#lastCallback.bind(this), this.#remain).unref();
    }
  }

  #autoRefreshCallback() {
    this.#remain -= _maxTimerDelay;
    if (this.#remain > _maxTimerDelay) return this.#timeout.refresh();
    this.#start();
  }

  #lastCallback() {
    this.#called = true;
    this.#callback();
  }

  get delay() { return this.#delay; }
  /** @readonly */
  get remain() { return this.#remain; }

  set delay(delay) {
    this.#delay = delay;

    const diff = delay - this.#delay;

    this.#remain += diff;

    if (this.#called) return;

    if (diff) this.restart();
  }

  /** If true, the `Timeout` object will keep the Node.js event loop active. */
  hasRef() { return this.#timeout.hasRef(); }

  ref() {
    this.#timeout.ref();
    return this;
  }

  unref() {
    this.#timeout.unref();
    return this;
  }

  reset() {
    this.#remain = this.#delay;
    this.restart();
  }

  refresh() {
    this.#timeout.refresh();
    return this;
  }

  restart() {
    this.close();
    this.#start();
  }

  close() {
    clearTimeout(this.#timeout);
    return this;
  }

  dispose() { this.#timeout[Symbol.dispose](); }

  [Symbol.toPrimitive]() { return this.#timeout[Symbol.toPrimitive](); }

  [Symbol.dispose]() { this.#timeout[Symbol.dispose](); }
}
