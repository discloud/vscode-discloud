import BaseAuthenticationError from "./base";

export default class UnknownError extends BaseAuthenticationError {
  readonly name = "Unknown";

  constructor() {
    super();
  }
}
