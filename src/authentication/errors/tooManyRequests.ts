export default class TooManyRequestsError extends Error {
  static readonly code = 429;
  readonly core = TooManyRequestsError.code;
  readonly name = "Too Many Requests";
}
