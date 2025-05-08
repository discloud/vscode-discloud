import AsyncQueueRepository from "./AsyncQueueRepository";
import { type AsyncQueueKey } from "./types";

export default class AsyncQueue {
  readonly #repository: AsyncQueueRepository = new AsyncQueueRepository(this);

  #resolveKey(key?: AsyncQueueKey) {
    return this.#repository.resolveKey(key);
  }

  shift(key?: AsyncQueueKey) {
    key = this.#resolveKey(key);

    this.#repository.resolve(key);
  }

  wait(key?: AsyncQueueKey) {
    key = this.#resolveKey(key);

    const size = this.#repository.getSize(key);

    const entity = this.#repository.add(key);

    if (!size) return Promise.resolve();

    return entity.promise;
  }
}
