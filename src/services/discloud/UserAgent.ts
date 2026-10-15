import { arch, platform, release, type } from "os";
import type { ExtensionContext } from "vscode";

const _product = "vscode";

function _osProperties() { return `(${type()} ${_formatOsRelease(release())}; ${platform()}; ${arch()})`; }

function _formatOsRelease(r: string) { return r.split?.(".").slice(0, 2).join(".") ?? r; }

export default class UserAgent {
  constructor(readonly context: ExtensionContext) { }

  #userAgent!: string;

  #getUserAgent() { return `${_product}/${this.version} ${_osProperties()}`; }

  get version() { return this.context.extension.packageJSON.version; }

  toString() { return this.#userAgent ??= this.#getUserAgent(); }
}
