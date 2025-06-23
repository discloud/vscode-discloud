export default class DiscloudAPIError<T = any> extends Error {
  constructor(
    readonly body: T,
    readonly code: number,
    readonly method: string,
    readonly path: string,
    readonly requestBody?: any,
  ) {
    // @ts-expect-error ts(2339)
    super(body?.message ?? body);
  }
}
