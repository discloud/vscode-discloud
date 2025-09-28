export class NetworkUnreachableError extends Error {
  readonly name = "NetworkUnreachable";

  constructor(
    readonly reason: Buffer,
  ) {
    super("Network unreachable");
  }
}
