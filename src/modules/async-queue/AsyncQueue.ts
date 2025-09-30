import AsyncQueueRepository from "./AsyncQueueRepository";
import { type AsyncQueueKey } from "./types";

export default class AsyncQueue {
  readonly #repository: AsyncQueueRepository = new AsyncQueueRepository();

  shift(key?: AsyncQueueKey) {
    this.#repository.shift(key);
  }

  wait(key?: AsyncQueueKey) {
    const entity = this.#repository.push(key);

    if (entity.isFirst) return Promise.resolve();

    return entity.promise;
  }
}
