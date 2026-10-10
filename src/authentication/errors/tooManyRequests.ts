export default class TooManyRequestsError {
  static readonly code = 429;

  readonly name = "Too Many Requests";
}
