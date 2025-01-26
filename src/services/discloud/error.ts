export default class DiscloudAPIError extends Error {
  constructor(
    readonly responseBody: any,
    readonly code: number,
    readonly method: string,
    readonly path: string,
    readonly requestBody?: any,
  ) {
    if (typeof (responseBody.message ?? requestBody) === "string") {
      super(responseBody.message ?? requestBody);
    } else {
      super();
    }
  }
}
