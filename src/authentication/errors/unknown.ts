export default class UnknownError {
  readonly name = "Unknown";

  constructor(readonly code: number) { }
}
