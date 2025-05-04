import AsyncQueueRepository from "./AsyncQueueRepository";
import { type AsyncQueueKey } from "./types";

export default class AsyncQueue {
  readonly #repository = new AsyncQueueRepository(this);

  shift(key?: AsyncQueueKey) {
    const cached = this.#repository.get(key);

    if (!cached.length) return;

    if (cached.length === 1) {
      cached.shift();
      return;
    }

    cached.shift();
    cached[0].use();
  }

  wait(key?: AsyncQueueKey) {
    const entity = this.#repository.add(key);

    const cached = this.#repository.get(entity.key);

    if (cached.length === 1) return Promise.resolve();

    return entity.promise;
  }
}