import { SOCKET_UNAUTHORIZED_CODE } from "../../constants";

export class UnauthorizedError extends Error {
  readonly code = SOCKET_UNAUTHORIZED_CODE;
  readonly name = "Unauthorized";

  constructor(
    readonly reason: Buffer,
  ) {
    super("Unauthorized");
  }
}
