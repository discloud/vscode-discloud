import { StatusBarItem, window } from "vscode";
import extension from "../extension";
import { bindFunctions } from "../util";

export default class BaseStatusBarItem implements StatusBarItem {
  protected readonly originalData: Omit<StatusBarItem, "alignment" | "dispose" | "id" | "hide" | "priority" | "show">;
  readonly data: StatusBarItem;

  constructor(data: Partial<Omit<StatusBarItem, "dispose" | "hide" | "show">>) {
    this.data = window.createStatusBarItem(data.alignment, data.priority);
    extension.subscriptions.push(this.data);
    bindFunctions(this.data);
    this.originalData = Object.assign(Object.create(this.data), this.data);
    this.set(data);
  }

  reset(data: Partial<Omit<StatusBarItem, "alignment" | "dispose" | "id" | "hide" | "priority" | "show">> = this.originalData) {
    this.set(data);
  }

  set(data: Partial<StatusBarItem>) {
    this.accessibilityInformation = data.accessibilityInformation ?? this.data.accessibilityInformation;
    this.backgroundColor = data.backgroundColor ?? this.data.backgroundColor;
    this.color = data.color ?? this.data.color;
    this.command = data.command ?? this.data.command;
    this.name = data.name ?? this.data.name;
    this.text = data.text ?? this.data.text;
    this.tooltip = data.tooltip ?? this.data.tooltip;
  }

  get accessibilityInformation() {
    return this.data.accessibilityInformation;
  }
  set accessibilityInformation(accessibilityInformation) {
    this.data.accessibilityInformation = accessibilityInformation;
  }
  /** @readonly */
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
  /** @readonly */
  get id() {
    return this.data.id;
  }
  get name() {
    return this.data.name;
  }
  set name(name) {
    this.data.name = name;
  }
  /** @readonly */
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
