export default class NotFoundError extends Error {
  static readonly code = 404;
  readonly code = 404;
  readonly name = "Not Found";
}
