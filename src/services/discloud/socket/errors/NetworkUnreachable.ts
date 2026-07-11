export class NetworkUnreachableError extends Error {
  constructor(
    readonly reason: Buffer,
  ) {
    super();
  }

  readonly name = "NetworkUnreachable";
}
