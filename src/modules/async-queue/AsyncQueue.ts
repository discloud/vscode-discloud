import AsyncQueueRepository from "./AsyncQueueRepository";
import { type AsyncQueueKey } from "./types";

export default class AsyncQueue {
  readonly #repository: AsyncQueueRepository = new AsyncQueueRepository();

  #resolveKey(key?: AsyncQueueKey) {
    return this.#repository.resolveKey(key);
  }

  shift(key?: AsyncQueueKey) {
    key = this.#resolveKey(key);

    this.#repository.shift(key);
  }

  wait(key?: AsyncQueueKey) {
    key = this.#resolveKey(key);

    const size = this.#repository.getSize(key);

    const entity = this.#repository.push(key);

    if (!size) return Promise.resolve();

    return entity.promise;
  }
}
