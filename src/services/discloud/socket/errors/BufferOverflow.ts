export default class BufferOverflowError extends Error {
  readonly name = "BufferOverflow";

  constructor() {
    super();
  }
}
