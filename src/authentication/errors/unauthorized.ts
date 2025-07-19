import BaseAuthenticationError from "./base";

export default class UnauthorizedError extends BaseAuthenticationError {
  static readonly code = 401;

  readonly name = "Unauthorized";

  constructor() {
    super();
  }
}
