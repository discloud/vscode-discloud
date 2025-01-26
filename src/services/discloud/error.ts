export default class DiscloudAPIError extends Error {
  constructor(
    readonly responseBody: any,
    readonly code: number,
    readonly method: string,
    readonly path: string,
    readonly requestBody?: any,
  ) {
    if (typeof (responseBody?.message ?? responseBody) === "string") {
      super(responseBody?.message ?? responseBody);
    } else {
      super();
    }
  }
}
