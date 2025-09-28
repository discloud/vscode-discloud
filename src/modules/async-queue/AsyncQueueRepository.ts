import Queue from "yocto-queue";
import AsyncQueueEntity from "./AsyncQueueEntity";
import { type AsyncQueueKey } from "./types";

export default class AsyncQueueRepository {
  readonly #cache: Map<AsyncQueueKey, Queue<AsyncQueueEntity>> = new Map();
  readonly #internalKey: symbol = Symbol("internal");

  resolveKey(key?: AsyncQueueKey) {
    return key ?? this.#internalKey;
  }

  #resolveCached(key: AsyncQueueKey) {
    let cached = this.#cache.get(key);
    if (cached) return cached;

    cached = new Queue();
    this.#cache.set(key, cached);

    return cached;
  }

  getSize(key: AsyncQueueKey) {
    return this.#resolveCached(key).size;
  }

  push(key: AsyncQueueKey) {
    const cached = this.#resolveCached(key);
    const entity = new AsyncQueueEntity();
    cached.enqueue(entity);
    return entity;
  }

  shift(key: AsyncQueueKey) {
    const cached = this.#resolveCached(key);
    cached.dequeue();
    cached.peek()?.resolve();
  }
}
