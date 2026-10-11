import { arch, platform, release, type } from "os";
import type { ExtensionContext } from "vscode";

function _osProperties() { return `(${type()} ${_osRelease()}; ${platform()}; ${arch()})`; }

function _osRelease() { return release().split?.(".").slice(0, 2).join(".") ?? release(); }

export default class UserAgent {
  constructor(readonly context: ExtensionContext) { }

  readonly prefix: string = "vscode";
  #userAgent!: string;

  #getUserAgent() { return `${this.prefix}/${this.version} ${_osProperties()}`; }

  get version() { return this.context.extension.packageJSON.version; }

  toString() { return this.#userAgent ??= this.#getUserAgent(); }
}
