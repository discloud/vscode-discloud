import { t } from "@vscode/l10n";
import { StatusBarItem as IStatusBarItem, ThemeColor, window, workspace } from "vscode";
import extension from "../extension";
import { bindFunctions } from "../util";

export default class StatusBarItem implements IStatusBarItem {
  protected readonly originalData: Omit<IStatusBarItem, "alignment" | "dispose" | "id" | "hide" | "priority" | "show">;
  readonly data: IStatusBarItem;

  constructor(data: Partial<Omit<IStatusBarItem, "dispose" | "hide" | "show">>) {
    this.data = window.createStatusBarItem(data.alignment, data.priority);
    bindFunctions(this.data);
    this.set(data);
    this.originalData = this.extractData(this.data);

    if (workspace.workspaceFolders?.length) {
      this.show();
    } else {
      this.hide();
    }
  }

  get limited() {
    return this.text === t("status.text.ratelimited");
  }

  get loading() {
    return this.data.text.includes("$(loading~spin)");
  }

  get token() {
    return extension.config.get<string>("token");
  }

  reset(data: Partial<IStatusBarItem> = this.originalData) {
    if (this.limited) return;

    this.accessibilityInformation = data.accessibilityInformation ?? this.originalData.accessibilityInformation;
    this.backgroundColor = data.backgroundColor ?? this.originalData.backgroundColor;
    this.color = data.color ?? this.originalData.color;
    this.command = data.command ?? this.originalData.command;
    this.name = data.name ?? this.originalData.name;
    this.text = data.text ?? this.originalData.text;
    this.tooltip = data.tooltip ?? this.originalData.tooltip;

    if (this.token) {
      this.setUpload();
    } else {
      this.setLogin();
    }
  }

  set(data: Partial<IStatusBarItem>) {
    this.accessibilityInformation = data.accessibilityInformation ?? this.data.accessibilityInformation;
    this.backgroundColor = data.backgroundColor ?? this.data.backgroundColor;
    this.color = data.color ?? this.data.color;
    this.command = data.command ?? this.data.command;
    this.name = data.name ?? this.data.name;
    this.text = data.text ?? this.data.text;
    this.tooltip = data.tooltip ?? this.data.tooltip;
  }

  setLogin() {
    if (this.limited) return;

    this.command = "discloud.login";
    this.text = t("status.text.login");
    this.tooltip = t("status.tooltip.login");
  }

  setCommiting() {
    if (this.limited) return;

    this.command = undefined;
    this.text = t("status.text.commiting");
    this.tooltip = undefined;
  }

  setLoading() {
    if (this.limited) return;

    this.command = undefined;
    this.text = t("status.text.loading");
    this.tooltip = undefined;
  }

  setRateLimited(limited?: boolean) {
    if (typeof limited === "boolean") {
      if (limited) {
        this.command = undefined;
        this.backgroundColor = new ThemeColor("statusBarItem.warningBackground");
        this.text = t("status.text.ratelimited");
        this.tooltip = t("status.tooltip.ratelimited");
      } else {
        this.text = this.originalData.text;
        this.reset();
      }
    } else {
      this.setRateLimited(!this.limited);
    }
  }

  setUpload() {
    if (this.limited) return;

    this.command = "discloud.upload";
    this.text = t("status.text.upload");
    this.tooltip = t("status.tooltip.upload");
  }

  setUploading() {
    if (this.limited) return;

    this.command = undefined;
    this.text = t("status.text.uploading");
    this.tooltip = undefined;
  }

  setText(text: string) {
    if (this.limited) return;

    if (typeof text === "string") this.text = text;
  }

  protected extractData<T>(instance: T) {
    const propertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(instance));

    const data = <any>{};

    for (const propertyName of propertyNames)
      data[propertyName] = (<any>instance)[propertyName];

    return <T>data;
  }

  get accessibilityInformation() {
    return this.data.accessibilityInformation;
  }
  set accessibilityInformation(accessibilityInformation) {
    this.data.accessibilityInformation = accessibilityInformation;
  }
  get alignment() {
    return this.data.alignment;
  }
  get backgroundColor() {
    return this.data.backgroundColor;
  }
  set backgroundColor(backgroundColor) {
    this.data.backgroundColor = backgroundColor;
  }
  get color() {
    return this.data.color;
  }
  set color(color) {
    this.data.color = color;
  }
  get command() {
    return this.data.command;
  }
  set command(command) {
    this.data.command = command;
  }
  get dispose() {
    return this.data.dispose;
  }
  get hide() {
    return this.data.hide;
  }
  get id() {
    return this.data.id;
  }
  get name() {
    return this.data.name;
  }
  set name(name) {
    this.data.name = name;
  }
  get priority() {
    return this.data.priority;
  }
  get show() {
    return this.data.show;
  }
  get text() {
    return this.data.text;
  }
  set text(text) {
    this.data.text = text;
  }
  get tooltip() {
    return this.data.tooltip;
  }
  set tooltip(tooltip) {
    this.data.tooltip = tooltip;
  }
}
