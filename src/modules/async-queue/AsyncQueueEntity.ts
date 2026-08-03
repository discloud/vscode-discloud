const _firstIndex = 0;

export default class AsyncQueueEntity implements PromiseWithResolvers<void> {
  constructor(
    readonly index: number,
  ) { }

  /** @readonly */
  get isFirst() { return this.index === _firstIndex; }

  /** @readonly */
  get isNotFirst() { return this.index !== _firstIndex; };

  readonly #promiseWithResolvers: PromiseWithResolvers<void> = Promise.withResolvers<void>();

  /** @readonly */
  get promise() { return this.#promiseWithResolvers.promise; };

  resolve() { this.#promiseWithResolvers.resolve(); }

  reject(reason?: any) { this.#promiseWithResolvers.reject(reason); }
}
