export default class WarningError extends Error {
  readonly name = "warning";

  constructor(message: string) {
    super(message);
  }
}
