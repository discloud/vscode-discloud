import BaseAuthenticationError from "./base";

export default class InternalServerError extends BaseAuthenticationError {
  static readonly code = 500;

  readonly name = "Internal Server";

  constructor() {
    super();
  }
}
