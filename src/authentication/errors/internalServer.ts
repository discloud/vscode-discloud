export default class InternalServerError extends Error {
  static readonly code = 500;
  readonly code = 500;
  readonly name = "Internal Server";
}
