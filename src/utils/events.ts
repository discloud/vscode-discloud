import { type EventEmitter, once } from "events";

export function multiListener
  <T extends Record<keyof T, any[]>, K extends keyof T = keyof T>
  (emitter: EventEmitter<T>, eventNames: K | Array<K>):
  AsyncGenerator<[K, ...T[K]]>

export async function* multiListener(emitter: EventEmitter, eventNames: any[]) {
  const abortControllers = new Map<string, AbortController>();

  async function makeListener(event: string, index: number) {
    let abortController = abortControllers.get(event);
    if (!abortController) {
      abortController = new AbortController();
      abortControllers.set(event, abortController);
    }

    try {
      const values = await once(emitter, event, { signal: abortController.signal });
      return { event, index, values };
    } catch { }
    return null;
  }

  if (!Array.isArray(eventNames)) eventNames = [eventNames];

  const listeners = eventNames.map(makeListener);

  try {
    while (true) {
      const result = await Promise.race(listeners);
      if (!result) break;
      listeners[result.index] = makeListener(result.event, result.index);
      yield [result.event, ...result.values];
    }
  } finally {
    for (const abortController of abortControllers.values()) abortController.abort();
    abortControllers.clear();
  }
}
