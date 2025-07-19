import BaseAuthenticationError from "./base";

export default class BadGatewayError extends BaseAuthenticationError {
  static readonly code = 502;

  readonly name = "Bad Gateway";

  constructor() {
    super();
  }
}
