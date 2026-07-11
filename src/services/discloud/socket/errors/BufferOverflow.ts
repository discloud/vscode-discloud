export default class BufferOverflowError extends Error {
  static check(currentSize: number, maxSize: number) {
    if (currentSize > maxSize) throw new BufferOverflowError(currentSize, maxSize);
  }

  constructor(
    readonly currentSize: number,
    readonly maxSize: number,
  ) {
    super();
  }

  readonly name = "BufferOverflow";
}
