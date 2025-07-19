export class UnauthorizedError extends Error {
  readonly name = "Unauthorized";

  constructor() {
    super("Unauthorized");
  }
}
