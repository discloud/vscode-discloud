
import { type ExtensionContext, type OutputChannel, window } from "vscode";

export default abstract class DiscloudOutputChannel implements OutputChannel {
  protected static readonly _instances = new Map<string, DiscloudOutputChannel>();

  static disposeNamed(name: string, delay?: number) {
    DiscloudOutputChannel._instances.get(name)?.dispose(delay);
  }

  static getInstance(context: ExtensionContext, name: string, languageId?: string) {
    const instance = DiscloudOutputChannel._instances.getOrInsertComputed(name, () => {
      const channel = window.createOutputChannel(name, languageId);
      const instance = new _DiscloudOutputChannel(context, channel);
      context.subscriptions.push(instance);
      return instance;
    });
    instance._clearDisposeTimer();
    return instance;
  }

  constructor(
    readonly context: ExtensionContext,
    protected readonly _channel: OutputChannel,
  ) { }

  declare protected _disposeTimer: NodeJS.Timeout;

  /** @readonly */
  get name() { return this._channel.name; }

  append(value: string) {
    this._clearDisposeTimer();
    this._channel.append(value);
  }

  appendLine(value: string) {
    this._clearDisposeTimer();
    this._channel.appendLine(value);
  }

  replace(value: string) {
    this._clearDisposeTimer();
    this._channel.replace(value);
  }

  clear() {
    this._clearDisposeTimer();
    this._channel.clear();
  }

  show(preserveFocus?: boolean): void
  show(): void
  show(preserveFocus?: boolean) {
    this._clearDisposeTimer();
    this._channel.show(preserveFocus);
  }

  hide() {
    this._clearDisposeTimer();
    this._channel.hide();
  }

  dispose(delay?: number) {
    this._clearDisposeTimer();

    if (typeof delay === "number") {
      this._disposeTimer = setTimeout(this._dispose.bind(this), delay).unref();
    } else {
      this._dispose();
    }
  }

  protected _clearDisposeTimer() {
    clearTimeout(this._disposeTimer);
  }

  protected _dispose() {
    this._clearDisposeTimer();
    DiscloudOutputChannel._instances.delete(this.name);
    this._channel.dispose();
  }
}

class _DiscloudOutputChannel extends DiscloudOutputChannel { }
