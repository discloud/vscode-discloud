export default class BaseAuthenticationError extends Error {
  static async fromStatusCode(statusCode: number) {
    const { default: UnauthorizedError } = await import("./unauthorized");
    const { default: NotFoundError } = await import("./notFound");
    const { default: TooManyRequestsError } = await import("./tooManyRequests");
    const { default: InternalServerError } = await import("./internalServer");
    const { default: BadGatewayError } = await import("./badGateway");
    const { default: UnknownError } = await import("./unknown");

    switch (statusCode) {
      case UnauthorizedError.code:
        return new UnauthorizedError();
      case NotFoundError.code:
        return new NotFoundError();
      case TooManyRequestsError.code:
        return new TooManyRequestsError();
      case InternalServerError.code:
        return new InternalServerError();
      case BadGatewayError.code:
        return new BadGatewayError();
      default:
        return new UnknownError();
    }
  }
}
