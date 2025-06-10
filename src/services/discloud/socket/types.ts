export interface SocketEventsMap {
  connecting: []
  connect: []
  close: [code: number, reason: Buffer]
  error: [error: Error]
}

export interface SocketOptions {
  /**
   * @default 10_000
   */
  connectingTimeout?: number
}
