export default class UnknownError extends Error {
  readonly name = "Unknown";

  constructor(readonly code: number) {
    super();
  }
}
