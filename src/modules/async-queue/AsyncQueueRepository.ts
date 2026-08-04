import Queue from "yocto-queue";
import AsyncQueueEntity from "./AsyncQueueEntity";
import type { AsyncQueueKey } from "./types";

// eslint-disable-next-line func-style
const _queueFactory = <ValueType>() => new Queue<ValueType>();

export default class AsyncQueueRepository {
  readonly #cache: Map<AsyncQueueKey, Queue<AsyncQueueEntity>> = new Map();
  readonly #internalKey: symbol = Symbol("internal");

  getSize(key?: AsyncQueueKey) {
    return this.#cache.getOrInsertComputed(key ?? this.#internalKey, _queueFactory).size;
  }

  push(key?: AsyncQueueKey) {
    const cached = this.#cache.getOrInsertComputed(key ?? this.#internalKey, _queueFactory);
    const entity = new AsyncQueueEntity(cached.size);
    cached.enqueue(entity);
    return entity;
  }

  shift(key?: AsyncQueueKey) {
    const cached = this.#cache.getOrInsertComputed(key ?? this.#internalKey, _queueFactory);
    cached.dequeue();
    cached.peek()?.resolve();
  }
}
