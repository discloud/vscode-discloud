import { t } from "@vscode/l10n";
import { EventEmitter } from "events";
import { setTimeout as sleep } from "timers/promises";
import type vscode from "vscode";
import WebSocket from "ws";
import extension from "../../../extension";
import { MAX_UPLOAD_SIZE, MAX_ZIP_BUFFER_PART } from "../constants";
import { type SocketEventsMap, type SocketOptions } from "./types";

export default class SocketClient<Data extends Record<any, any> = Record<any, any>>
  extends EventEmitter<SocketEventsMap<Data>>
  implements vscode.Disposable, Disposable {
  constructor(protected wsURL: URL, options?: SocketOptions) {
    super({ captureRejections: true });

    if (options) {
      if (options.connectingTimeout !== undefined)
        this._connectingTimeout = options.connectingTimeout;

      if (typeof options.disposeOnClose === "boolean")
        this._disposeOnClose = options.disposeOnClose;

      if (options.headers) Object.assign(this._headers, options.headers);
    }
  }

  protected readonly _connectingTimeout: number | null = 10_000;
  protected readonly _disposeOnClose: boolean = true;
  protected readonly _headers: Record<string, string> = {};
  declare protected _socket?: WebSocket;
  declare protected _ping: number;
  declare protected _pong: number;
  declare ping: number;

  get closed() {
    return !this._socket || this._socket.readyState === this._socket.CLOSED;
  }

  get closing() {
    return this._socket ? this._socket.readyState === this._socket.CLOSING : false;
  }

  get connected() {
    return this._socket ? this._socket.readyState === this._socket.OPEN : false;
  }

  get connecting() {
    return this._socket ? this._socket.readyState === this._socket.CONNECTING : false;
  }

  close() {
    if (this._socket) {
      this._socket.removeAllListeners().close();
      delete this._socket;
    }
  }

  dispose() {
    this.close();
    this.removeAllListeners();
  }

  async connect() {
    await new Promise<void>((resolve, reject) => {
      if (this.connected) return resolve();
      this.#createWebSocket().then(resolve).catch(reject);
    });
  }

  async #waitConnect() {
    await new Promise<void>((resolve, reject) => {
      if (this.connecting) {
        const onConnect = () => {
          this.off("close", onClose);
          resolve();
        };
        const onClose = () => {
          this.off("connect", onConnect);
          reject();
        };
        return this.once("connect", onConnect).once("close", onClose);
      }
      if (this.connected) return resolve();
      reject();
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

  async sendBuffer(buffer: Buffer) {
    if (!this.connected) await this.connect();

    await new Promise<void>((resolve, reject) => {
      this._socket!.send(buffer, (err) => {
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

      await sleep();
    }
  }

  #createWebSocket() {
    return new Promise<void>((resolve, reject) => {
      if (this.connecting) return this.#waitConnect().then(resolve).catch(reject);

      if (this.connected) return resolve();

      this.emit("connecting");

      const options: ConstructorParameters<typeof WebSocket>[2] = {
        headers: Object.assign({ "api-token": extension.api.token! },
          extension.api.options.userAgent ? { "User-Agent": extension.api.options.userAgent } : {},
          this._headers),
        ...typeof this._connectingTimeout === "number"
          ? { signal: AbortSignal.timeout(this._connectingTimeout) }
          : {},
      };

      this._socket = new WebSocket(this.wsURL, options)
        .once("close", (code, reason) => {
          this.emit("close", code, reason);
          if (this._disposeOnClose) queueMicrotask(() => this.dispose());
        })
        .on("error", (error) => {
          this.emit("error", error);
        })
        .on("message", (data) => {
          try { this.emit("data", JSON.parse(data.toString())); }
          catch { this.emit("message", data); }
        })
        .once("open", () => {
          this._ping = Date.now();
          this._socket!.ping();
          this.emit("connect");
          resolve();
        })
        .on("ping", () => {
          this._ping = Date.now();
          this._socket!.ping();
        })
        .on("pong", () => {
          this._pong = Date.now();
          this.ping = this._pong - this._ping;
        });
    });
  }

  [Symbol.dispose]() {
    this.dispose();
  }
}
