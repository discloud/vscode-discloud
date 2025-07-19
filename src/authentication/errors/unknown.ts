export class UnknownError extends Error {
  readonly name = "Unknown";

  constructor() {
    super("Unknown");
  }
}
