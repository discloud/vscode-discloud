import { SOCKET_UNAUTHORIZED_CODE } from "../../constants";

export class UnauthorizedError extends Error {
  constructor(
    readonly reason: Buffer,
  ) {
    super();
  }

  readonly code = SOCKET_UNAUTHORIZED_CODE;
  readonly name = "Unauthorized";
}
