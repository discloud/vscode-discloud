export default class TooManyRequestsError extends Error {
  static readonly code = 429;
  readonly core = 429;
  readonly name = "Too Many Requests";
}
