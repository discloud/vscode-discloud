export default class BufferOverflowError extends Error {
  readonly name = "BufferOverflow";

  constructor(
    readonly max: number,
  ) {
    super();
  }
}
