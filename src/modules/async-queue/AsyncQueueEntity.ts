import { type AsyncQueueKey } from "./types";

export default class AsyncQueueEntity {
  constructor(
    readonly key: AsyncQueueKey,
  ) {
    this.promise = new Promise((resolve, _reject) => { this.#resolve = resolve; });
  }

  #resolve!: () => void;

  declare readonly promise: Promise<void>;

  resolve() {
    this.#resolve();
    return this;
  }
}
