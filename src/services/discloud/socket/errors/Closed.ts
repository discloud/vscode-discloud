export default class ClosedError extends Error {
  constructor(
    readonly code: number,
    readonly reason: Buffer,
  ) {
    super();
  }

  readonly name = "Closed";
}
