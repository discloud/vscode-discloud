import Queue from "yocto-queue";
import AsyncQueueEntity from "./AsyncQueueEntity";
import { type AsyncQueueKey } from "./types";

export default class AsyncQueueRepository {
  readonly #cache: Map<AsyncQueueKey, Queue<AsyncQueueEntity>> = new Map();
  readonly #internalKey: symbol = Symbol("internal");

  #getCached(key?: AsyncQueueKey) {
    key ??= this.#internalKey;

    let cached = this.#cache.get(key);
    if (cached) return cached;

    cached = new Queue();
    this.#cache.set(key, cached);

    return cached;
  }

  getSize(key?: AsyncQueueKey) {
    return this.#getCached(key).size;
  }

  push(key?: AsyncQueueKey) {
    const cached = this.#getCached(key);
    const entity = new AsyncQueueEntity(cached.size);
    cached.enqueue(entity);
    return entity;
  }

  shift(key?: AsyncQueueKey) {
    const cached = this.#getCached(key);
    cached.dequeue();
    cached.peek()?.resolve();
  }
}
