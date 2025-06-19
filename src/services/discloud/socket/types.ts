import { type ApiUploadApp } from "discloud.app";
import { type RawData } from "ws";

export interface SocketEventsMap<Data extends Record<any, any> = Record<any, any>> {
  connecting: []
  connect: []
  close: [code: number, reason: Buffer]
  data: [data: Data]
  error: [error: Error]
  message: [data: RawData]
}

export interface SocketOptions {
  /**
   * Connecting timeout in milliseconds
   * 
   * @default 10_000
   */
  connectingTimeout?: number | null
  /**
   * @default true
   */
  disposeOnClose?: boolean
  headers?: Record<string, string>
}

export interface SocketEventUploadData {
  app?: ApiUploadApp
  logs?: string
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

export interface ProgressData {
  current: number
  total: number
}

export type OnProgressCallback = (data: ProgressData) => unknown | Promise<unknown>
