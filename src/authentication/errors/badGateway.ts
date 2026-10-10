export default class BadGatewayError extends Error {
  static readonly code = 502;
  readonly code = 502;
  readonly name = "Bad Gateway";
}
