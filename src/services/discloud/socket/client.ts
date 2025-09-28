import { EventEmitter } from "events";
import type vscode from "vscode";
import WebSocket from "ws";
import core from "../../../extension";
import { DEFAULT_CHUNK_SIZE, MAX_FILE_SIZE, NETWORK_UNREACHABLE_CODE, SOCKET_ABNORMAL_CLOSURE, SOCKET_UNAUTHORIZED_CODE } from "../constants";
import { SocketEvents } from "./enum/events";
import BufferOverflowError from "./errors/BufferOverflow";
import ClosedError from "./errors/Closed";
import { NetworkUnreachableError } from "./errors/NetworkUnreachable";
import { UnauthorizedError } from "./errors/Unauthorized";
import { type BufferLike, type OnProgressCallback, type ProgressData, type SocketEventsMap, type SocketOptions } from "./types";

export default class SocketClient<Data extends Record<any, any> = Record<any, any>>
  extends EventEmitter<SocketEventsMap<Data>>
  implements vscode.Disposable, Disposable {
  constructor(protected wsURL: URL, options?: SocketOptions) {
    super({ captureRejections: true });

    if (options) {
      if (options.chunkSize !== undefined)
        this._chunkSize = options.chunkSize;

      if (options.connectingTimeout !== undefined)
        this._connectingTimeout = options.connectingTimeout;

      if (options.headers) Object.assign(this._headers, options.headers);
    }
  }

  protected _chunkSize: number = DEFAULT_CHUNK_SIZE;
  /** @internal */
  declare protected _connected: boolean;
  protected readonly _connectingTimeout: number | null = 10_000;
  protected readonly _headers: Record<string, string> = {};
  declare protected _error?: any;
  declare protected _socket?: WebSocket;
  declare protected _ping: number;
  declare protected _pong: number;

  get ping() { return this._pong; }

  get closed() { return !this._socket || this._socket.readyState === WebSocket.CLOSED; }
  get closing() { return this._socket ? this._socket.readyState === WebSocket.CLOSING : false; }
  get connected() { return this._socket ? this._socket.readyState === WebSocket.OPEN : false; }
  get connecting() { return this._socket ? this._socket.readyState === WebSocket.CONNECTING : false; }

  disconnect() {
    if (this._socket) {
      this._socket.removeAllListeners().close();
      delete this._socket;
    }
  }

  dispose() {
    this[Symbol.dispose]();
  }

  async connect() {
    await new Promise<void>((resolve, reject) => {
      if (this.connected) return resolve();
      this.#connect().then(resolve).catch(reject);
    });
  }

  async sendAsync(data: BufferLike) {
    if (!this.connected) await this.connect();

    await new Promise<void>((resolve, reject) => {
      this._socket!.send(data, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async sendJSON(value: Record<any, any> | any[]): Promise<void> {
    await this.sendAsync(JSON.stringify(value));
  }

  async sendBuffer(buffer: Buffer, onProgress?: OnProgressCallback) {
    if (buffer.length > MAX_FILE_SIZE) throw new BufferOverflowError(buffer.length, MAX_FILE_SIZE);

    /** Number of parts to be sent */
    const total = Math.ceil(buffer.length / this._chunkSize);
    /** Size of each part to be sent */
    const chunkSize = Math.ceil(buffer.length / total);

    for (let i = 0; i < total;) {
      const offset = chunkSize * i;
      const end = offset + chunkSize;
      const chunk = buffer.subarray(offset, end);
      const current = ++i;
      const pending = current < total;

      const data: ProgressData = { chunk, current, offset, pending, total };

      await this.sendJSON(data);

      await onProgress?.(data);
    }
  }

  async #connect() {
    if (this.connected) return;

    if (this.connecting) return await this.#waitConnect();

    return await this.#createWebSocket();
  }

  async #createWebSocket() {
    const headers = await this.#resolveHeaders(this._headers);

    return await new Promise<void>((resolve, reject) => {
      this.emit(SocketEvents.connecting);

      const options: ConstructorParameters<typeof WebSocket>[2] = {
        headers,
        ...typeof this._connectingTimeout === "number"
          ? { signal: AbortSignal.timeout(this._connectingTimeout) }
          : {},
      };

      this._socket = new WebSocket(this.wsURL, options)
        .once("close", (code, reason) => {
          queueMicrotask(() => this.dispose());

          const isConnected = this._connected;
          this._connected = false;

          switch (code) {
            case SOCKET_ABNORMAL_CLOSURE:
              if (isConnected) break;
              return reject(new NetworkUnreachableError(reason));

            case SOCKET_UNAUTHORIZED_CODE:
              return reject(new UnauthorizedError(reason));
          }

          if (this._error) {
            const error = this._error;
            delete this._error;

            switch (error.code) {
              case NETWORK_UNREACHABLE_CODE:
                return reject(new NetworkUnreachableError(reason));
            }
          }

          this.emit(SocketEvents.close, code, reason);
        })
        .on("error", (error) => {
          this.emit(SocketEvents.error, this._error = error);
        })
        .on("message", (data) => {
          try { this.emit(SocketEvents.data, JSON.parse(data.toString())); }
          catch { this.emit(SocketEvents.message, data); }
        })
        .once("open", () => {
          this._connected = true;
          delete this._error;

          this._ping = Date.now();
          this._socket!.ping();

          this.emit(SocketEvents.connected);

          resolve();
        })
        .on("ping", () => {
          this._ping = Date.now();
          this._socket!.ping();
        })
        .on("pong", () => {
          this._pong = Date.now() - this._ping;
        });
    });
  }

  async #waitConnect() {
    await new Promise<void>((resolve, reject) => {
      if (this.connecting) {
        const onConnected = () => {
          this.off(SocketEvents.close, onClose);
          resolve();
        };
        const onClose = (code: number, reason: Buffer) => {
          this.off(SocketEvents.connected, onConnected);
          reject(new ClosedError(code, reason));
        };
        return this.once(SocketEvents.connected, onConnected).once(SocketEvents.close, onClose);
      }
      if (this.connected) return resolve();
      reject(this._error);
    });
  }

  async #resolveHeaders(headers: Record<string, string>) {
    headers["api-token"] ??= (await core.api.getToken())!;

    if (core.api.options.userAgent)
      headers["User-Agent"] = core.api.options.userAgent.toString();

    return headers;
  }

  [Symbol.dispose]() {
    this.disconnect();
    this.removeAllListeners();
  }
}
