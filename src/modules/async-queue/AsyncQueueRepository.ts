import type AsyncQueue from "./AsyncQueue";
import AsyncQueueEntity from "./AsyncQueueEntity";
import { type AsyncQueueKey } from "./types";

export default class AsyncQueueRepository {
  constructor(
    readonly asyncQueue: AsyncQueue,
  ) { }

  readonly #cache: Map<AsyncQueueKey, AsyncQueueEntity[]> = new Map();
  readonly #internalKey: symbol = Symbol("internal");

  #resolveKey(key?: AsyncQueueKey) {
    return key ?? this.#internalKey;
  }

  #resolveCached(key: AsyncQueueKey) {
    let cached = this.#cache.get(key);
    if (cached) return cached;
    cached = [];
    this.#cache.set(key, cached);
    return cached;
  }

  add(key?: AsyncQueueKey) {
    key = this.#resolveKey(key);
    const cached = this.#resolveCached(key);
    const entity = new AsyncQueueEntity(key);
    cached.push(entity);
    return entity;
  }

  get(key?: AsyncQueueKey) {
    key = this.#resolveKey(key);
    return this.#resolveCached(key);
  }

  shift(key?: AsyncQueueKey) {
    key = this.#resolveKey(key);
    const cached = this.#resolveCached(key);
    return cached.shift();
  }
}
