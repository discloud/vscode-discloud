export default class ClosedError extends Error {
  readonly name = "Closed";

  constructor(
    readonly code: number,
    readonly reason: Buffer,
  ) {
    super();
  }
}
