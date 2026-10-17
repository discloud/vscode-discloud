export default class BadGatewayError extends Error {
  static readonly code = 502;
  readonly code = BadGatewayError.code;
  readonly name = "Bad Gateway";
}
