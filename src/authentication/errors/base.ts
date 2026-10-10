import BadGatewayError from "./badGateway";
import InternalServerError from "./internalServer";
import NotFoundError from "./notFound";
import TooManyRequestsError from "./tooManyRequests";
import UnauthorizedError from "./unauthorized";
import UnknownError from "./unknown";

export default abstract class BaseAuthenticationError {
  static async fromStatusCode(statusCode: number) {
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
        return new UnknownError(statusCode);
    }
  }
}
