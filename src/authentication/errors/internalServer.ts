export default class InternalServerError extends Error {
  static readonly code = 500;
  readonly code = InternalServerError.code;
  readonly name = "Internal Server";
}
