import { type Event, type ExtensionContext, type LogLevel, type LogOutputChannel, window } from "vscode";

export default class DiscloudLogOutputChannel implements LogOutputChannel {
  protected static readonly _instances = new Map<string, DiscloudLogOutputChannel>();

  static disposeNamed(name: string, delay?: number) {
    DiscloudLogOutputChannel._instances.get(name)?.dispose(delay);
  }

  static getInstance(context: ExtensionContext, name: string) {
    const instance = DiscloudLogOutputChannel._instances.get(name);
    if (instance) return instance;
    return new DiscloudLogOutputChannel(context, name);
  }

  constructor(readonly context: ExtensionContext, name: string) {
    const instance = DiscloudLogOutputChannel._instances.get(name);

    if (instance) {
      instance.clearDisposeTimer();
      this._channel = instance._channel;
    } else {
      DiscloudLogOutputChannel._instances.set(name, this);
      this._channel = window.createOutputChannel(name, { log: true });
      context.subscriptions.push(this);
    }
  }

  declare protected readonly _channel: LogOutputChannel;
  declare protected _disposeTimer: NodeJS.Timeout;

  /** @readonly */
  get logLevel(): LogLevel {
    return this._channel.logLevel;
  }

  /** @readonly */
  get name() {
    return this._channel.name;
  }

  /** @readonly */
  get onDidChangeLogLevel(): Event<LogLevel> {
    return this._channel.onDidChangeLogLevel;
  }

  trace(message: string, ...args: any[]) {
    this.clearDisposeTimer();
    this._channel.trace(message, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.clearDisposeTimer();
    this._channel.debug(message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.clearDisposeTimer();
    this._channel.info(message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.clearDisposeTimer();
    this._channel.warn(message, ...args);
  }

  error(error: string | Error, ...args: any[]) {
    this.clearDisposeTimer();
    this._channel.error(error, ...args);
  }

  append(value: string) {
    this.clearDisposeTimer();
    this._channel.append(value);
  }

  appendLine(value: string) {
    this.clearDisposeTimer();
    this._channel.appendLine(value);
  }

  replace(value: string) {
    this.clearDisposeTimer();
    this._channel.replace(value);
  }

  clear() {
    this.clearDisposeTimer();
    this._channel.clear();
  }

  show(preserveFocus?: boolean): void
  show(): void
  show(preserveFocus?: boolean) {
    this.clearDisposeTimer();
    this._channel.show(preserveFocus);
  }

  hide() {
    this.clearDisposeTimer();
    this._channel.hide();
  }

  dispose(delay?: number) {
    this.clearDisposeTimer();

    if (typeof delay === "number") {
      this._disposeTimer = setTimeout(() => this._dispose(), delay);
    } else {
      this._dispose();
    }
  }

  clearDisposeTimer() {
    clearTimeout(this._disposeTimer);
  }

  private _dispose() {
    this.clearDisposeTimer();
    DiscloudLogOutputChannel._instances.delete(this.name);
    this._channel.dispose();
  }
}