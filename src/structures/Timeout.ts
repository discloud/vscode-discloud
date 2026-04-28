const MAX_TIMER_DELAY = 2147483647;

export default class Timeout {
  constructor(callback: () => unknown, delay: number = 0) {
    this.#callback = callback;
    this.#remain = this.#delay = delay;
    this.#start();
  }

  #callback: () => unknown;
  #called: boolean = false;
  #delay: number;
  #remain!: number;
  #timeout!: NodeJS.Timeout;

  #start() {
    this.#called = false;
    if (this.#remain > MAX_TIMER_DELAY) {
      this.#timeout = setTimeout(() => {
        this.#remain -= MAX_TIMER_DELAY;
        if (this.#remain > MAX_TIMER_DELAY)
          this.#timeout.refresh();
        else this.#start();
      }, MAX_TIMER_DELAY).unref();
    } else {
      this.#timeout = setTimeout(() => {
        this.#called = true;
        this.#callback();
      }, this.#remain).unref();
    }
  }

  get delay() { return this.#delay; }
  /** @readonly */
  get remain() { return this.#remain; }

  set delay(delay) {
    const diff = delay - this.#delay;

    this.#delay = delay;

    this.#remain += diff;

    if (this.#called) return;

    if (diff) this.restart();
  }

  /** If true, the `Timeout` object will keep the Node.js event loop active. */
  get hasRef() {
    return this.#timeout.hasRef();
  }

  ref() {
    this.#timeout.ref();
  }

  unref() {
    this.#timeout.unref();
  }

  reset() {
    this.#remain = this.#delay;
    this.restart();
  }

  restart() {
    this.close();
    this.#start();
  }

  close() {
    clearTimeout(this.#timeout);
  }

  dispose() {
    this.close();
  }
}
