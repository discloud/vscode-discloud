export default class AsyncQueueEntity {
  constructor() {
    this.#promise = new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
    });
  }

  #resolve!: () => void;
  #reject!: (reason?: any) => void;

  readonly #promise!: Promise<void>;
  /** @readonly */
  get promise() { return this.#promise; };

  resolve() {
    this.#resolve();
    return this;
  }

  reject() {
    this.#reject();
    return this;
  }
}
