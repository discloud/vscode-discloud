import BaseAuthenticationError from "./base";

export default class TooManyRequestsError extends BaseAuthenticationError {
  static readonly code = 429;

  readonly name = "Too Many Requests";

  constructor() {
    super();
  }
}
