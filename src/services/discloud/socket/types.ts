import type { ApiUploadApp } from "discloud.app";
import type { RawData } from "ws";

export interface SocketEventsMap<Data extends Record<any, any> = Record<any, any>> {
  close: [code: number, reason: Buffer]
  connected: []
  connecting: []
  data: [data: Data]
  error: [error: Error]
  message: [data: RawData]
}

export interface SocketOptions {
  /**
   * Set the buffer chunk size per message
   * 
   * Note that very large chunks may cause unexpected closure
   * 
   * @default 262_144 (256KB)
   */
  chunkSize?: number
  /**
   * Connecting timeout in milliseconds
   * 
   * @default 10_000
   */
  connectingTimeout?: number | null
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
  chunk: Buffer
  current: number
  offset: number
  pending: boolean
  total: number
}

export type OnProgressCallback = (data: ProgressData) => unknown | Promise<unknown>
