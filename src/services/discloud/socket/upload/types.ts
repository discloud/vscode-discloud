import { type SocketEventsMap, type SocketOptions } from "../types";

export interface SocketUploadEventsMap extends SocketEventsMap {
  // API EVENTS
  upload: [data: SocketEventUploadData]
}

export interface SocketEventUploadData {
  event: string
  message: string | null
  progress: SocketProgressData
  status: "ok" | "error"
  statusCode: number
}

export interface SocketProgressData {
  /** `0 - 100` */
  bar: number
  log: string
}

export interface SocketUploadOptions extends SocketOptions {
  headers?: Record<string, string>
}
