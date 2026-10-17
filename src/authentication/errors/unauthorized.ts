export default class UnauthorizedError extends Error {
  static readonly code = 401;
  readonly code = UnauthorizedError.code;
  readonly name = "Unauthorized";
}
