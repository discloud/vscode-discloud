import { t } from "@vscode/l10n";
import { DiscloudConfig } from "discloud.app";
import { StatusBarItem as IStatusBarItem, ThemeColor, window, workspace } from "vscode";
import extension from "../extension";
import { bindFunctions, tokenIsValid } from "../util";

export default class StatusBarItem implements IStatusBarItem {
  protected readonly originalData: Omit<IStatusBarItem, "alignment" | "dispose" | "id" | "hide" | "priority" | "show">;
  readonly data: IStatusBarItem;

  constructor(data: Partial<Omit<IStatusBarItem, "dispose" | "hide" | "show">>) {
    this.data = window.createStatusBarItem(data.alignment, data.priority);
    extension.subscriptions.push(this.data);
    bindFunctions(this.data);
    this.set(data);
    this.originalData = Object.assign(Object.create(this.data), this.data);

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

    if (this.token && tokenIsValid) {
      this.setDefault();
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

  setCommitting() {
    if (this.limited) return;

    this.command = undefined;
    this.text = t("status.text.committing");
    this.tooltip = undefined;
  }

  setDefault() {
    if (this.limited) return;

    if (!extension.workspaceFolder) return this.setUpload();

    const dConfig = new DiscloudConfig(extension.workspaceFolder);

    if (!dConfig.data.ID) return this.setUpload();

    const app = extension.appTree.children.get(dConfig.data.ID) ??
      extension.teamAppTree.children.get(dConfig.data.ID);

    if (!app) return this.setUpload();

    if (typeof app.label === "string") {
      this.text = app.label;
    } else if (app.data.name || app.data.description) {
      this.text = app.data.name || app.data.description!;
    } else {
      return this.setUpload();
    }

    this.text = `$(console) ${this.text}`;
    this.command = "discloud.logs";
    this.tooltip = t("command.logs");
  }

  setLoading() {
    if (this.limited) return;

    this.command = undefined;
    this.text = t("status.text.loading");
    this.tooltip = undefined;
  }

  setLogin() {
    if (this.limited) return;

    this.command = "discloud.login";
    this.text = t("status.text.login");
    this.tooltip = t("status.tooltip.login");
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

  setText(text: string) {
    if (this.limited) return;

    if (typeof text === "string") this.text = text;
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
