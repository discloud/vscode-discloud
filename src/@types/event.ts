export interface IEventModule<E extends Record<keyof E, unknown[]>, K extends keyof E, V extends E[K] = E[K]> {
  readonly once?: boolean
  default(...args: V): void
}
