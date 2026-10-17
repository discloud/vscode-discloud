export default class NotFoundError extends Error {
  static readonly code = 404;
  readonly code = NotFoundError.code;
  readonly name = "Not Found";
}
