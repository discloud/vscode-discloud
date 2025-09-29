export default class AsyncQueueEntity {
  constructor(
    readonly index: number,
  ) {
    this.isFirst = !this.index;
  }

  declare readonly isFirst: boolean;

  readonly #promiseWithResolvers: PromiseWithResolvers<void> = Promise.withResolvers<void>();

  /** @readonly */
  get promise() { return this.#promiseWithResolvers.promise; };

  resolve() { this.#promiseWithResolvers.resolve(); }

  reject(reason?: any) { this.#promiseWithResolvers.reject(reason); }
}
