import { type AsyncQueueKey } from "./types";

export default class AsyncQueueEntity {
  declare readonly promise: Promise<void>;
  #resolve!: () => void;

  constructor(
    readonly key: AsyncQueueKey,
  ) {
    this.promise = new Promise((resolve, _reject) => {
      this.#resolve = resolve;
    });
  }

  use() {
    this.#resolve();
    return this;
  }
}