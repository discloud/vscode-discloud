import { type RouteLike } from "discloud.app";
import { type LogOutputChannel } from "vscode";
import { type RateLimitData } from "../../@types";
import { type RequestMethod } from "./enum";

export interface RESTEvents {
  debug: [...args: Parameters<LogOutputChannel["debug"]>]
  error: [error: Error]
  missingConnection: []
  rateLimited: [rateLimitData: RateLimitData]
  unauthorized: []
}

export interface RESTOptions {
  userAgent: string | { toString(): string }
}

export type RequestOptions = NonNullable<Parameters<typeof fetch>[1]>;

export interface RequestData {
  /**
   * The body to send to this request.
   */
  body?: RequestInit["body"] | unknown
  /**
   * Files to be attached to this request
   */
  files?: File[]
  /**
   * Additional headers to add to this request
   */
  headers?: RequestInit["headers"]
  /**
   * Query string parameters to append to the called endpoint
   */
  query?: ConstructorParameters<typeof URLSearchParams>[0]
}

/**
 * Internal request options
 *
 * @internal
 */
export interface InternalRequestData extends RequestData {
  fullRoute: RouteLike
  method: RequestMethod
}
