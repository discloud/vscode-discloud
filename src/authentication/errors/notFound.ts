import BaseAuthenticationError from "./base";

export default class NotFoundError extends BaseAuthenticationError {
  static readonly code = 404;

  readonly name = "Not Found";

  constructor() {
    super();
  }
}
