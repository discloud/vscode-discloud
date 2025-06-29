export class NetworkUnreachableError extends Error {
  readonly name = "NetworkUnreachable";

  constructor() {
    super("Network unreachable");
  }
}
