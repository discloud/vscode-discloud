import { type StatusBarItem, window } from "vscode";
import extension from "../extension";
import { bindFunctions } from "../util";

export default abstract class BaseStatusBarItem implements StatusBarItem {
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
    if (data.accessibilityInformation !== undefined) this.accessibilityInformation = data.accessibilityInformation;
    if (data.backgroundColor !== undefined) this.backgroundColor = data.backgroundColor;
    if (data.color !== undefined) this.color = data.color;
    if (data.command !== undefined) this.command = data.command;
    if (data.name !== undefined) this.name = data.name;
    if (data.text !== undefined) this.text = data.text;
    if (data.tooltip !== undefined) this.tooltip = data.tooltip;
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
