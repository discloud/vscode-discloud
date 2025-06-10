import { t } from "@vscode/l10n";
import { EventEmitter } from "events";
import { type ClientRequestArgs } from "http";
import { setTimeout as sleep } from "timers/promises";
import { type Disposable } from "vscode";
import WebSocket, { type ClientOptions } from "ws";
import { MAX_UPLOAD_SIZE, MAX_ZIP_BUFFER_PART } from "../../constants";
import { type SocketUploadEventsMap, type SocketUploadOptions } from "./types";

export default class SocketUploadClient extends EventEmitter<SocketUploadEventsMap> implements Disposable {
  constructor(protected wsURL: URL, options?: SocketUploadOptions) {
    super({ captureRejections: true });

    if (options) {
      if (typeof options.connectingTimeout === "number")
        this._connectingTimeout = options.connectingTimeout;

      if (options.headers) this._headers = options.headers;
    }
  }

  protected _headers: Record<string, string> = {};
  protected _connectingTimeout = 10_000;
  declare protected _socket?: WebSocket;
  declare protected _ping: number;
  declare protected _pong: number;
  declare ping: number;

  get closed() {
    if (!this._socket) return true;
    return this._socket.readyState === this._socket.CLOSED;
  }

  get closing() {
    if (!this._socket) return false;
    return this._socket.readyState === this._socket.CLOSING;
  }

  get connected() {
    if (!this._socket) return false;
    return this._socket.readyState === this._socket.OPEN;
  }

  get connecting() {
    if (!this._socket) return false;
    return this._socket.readyState === this._socket.CONNECTING;
  }

  dispose() {
    this._socket?.removeAllListeners().close();
    this.removeAllListeners();
    delete this._socket;
  }

  async connect() {
    await new Promise<void>((resolve, reject) => {
      if (this.connected) return resolve();
      this.#createWebSocket().then(resolve).catch(reject);
    });
  }

  async #waitConnect() {
    await new Promise<void>((r) => {
      if (this.connected) return r();
      this.on("connect", r);
    });
  }

  async sendJSON(value: Record<string, unknown>): Promise<void> {
    if (!this.connected) await this.connect();

    await new Promise<void>((resolve, reject) => {
      this._socket!.send(JSON.stringify(value), (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async sendFile(buffer: Buffer) {
    if (buffer.length > MAX_UPLOAD_SIZE) throw Error(t("file.too.big", { value: "512MB" }));

    const binaryLength = buffer.length;
    const parts = Math.ceil(buffer.length / MAX_ZIP_BUFFER_PART);
    const partSize = Math.ceil(binaryLength / parts);
    const encoding = "base64";

    for (let i = 0; i < parts; i++) {
      const part = i + 1;
      const startIndex = partSize * i;
      const endIndex = partSize * part;
      const file = buffer.subarray(startIndex, endIndex);

      await this.sendJSON({
        part,
        parts,
        encoding,
        file: file.toString(encoding),
      });

      await sleep(100);
    }
  }

  #createWebSocket() {
    return new Promise<void>((resolve, reject) => {
      try {
        if (this.connecting)
          return this.#waitConnect().then(resolve).catch(reject);

        if (this.connected) return resolve();

        this.emit("connecting");

        const options: ClientOptions | ClientRequestArgs = {
          headers: this._headers,
          signal: AbortSignal.timeout(this._connectingTimeout),
        };

        this._socket = new WebSocket(this.wsURL, options)
          .once("close", (code, reason) => {
            this.emit("close", code, reason);
          })
          .on("error", (error: any) => {
            this.emit("error", error);
          })
          .on("message", (data) => {
            try {
              const json = JSON.parse(data.toString());

              if (json.event) this.emit(json.event, json);
            } catch (error: any) {
              this.emit("error", error);
            }
          })
          .once("open", () => {
            this._ping = Date.now();
            this._socket!.ping();
            resolve();
            this.emit("connect");
          })
          .on("ping", () => {
            this._ping = Date.now();
            this._socket!.ping();
          })
          .on("pong", () => {
            this._pong = Date.now();
            this.ping = this._pong - this._ping;
          });
      } catch (error: any) {
        reject(error);
        this.emit("error", error);
      }
    });
  }
}
