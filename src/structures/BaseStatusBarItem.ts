import { type ExtensionContext, type StatusBarItem, window } from "vscode";
import { type CreateStatusBarItemOptions, type StatusBarItemData, type StatusBarItemOptions } from "../@types";

export default abstract class BaseStatusBarItem implements StatusBarItem {
  protected readonly originalData: StatusBarItemData;
  readonly data: StatusBarItem;

  constructor(readonly context: ExtensionContext, data: Partial<StatusBarItemOptions>) {
    context.subscriptions.push(this);

    const options = data.id ? [data.id, data.alignment, data.priority] : [data.alignment, data.priority];
    this.data = window.createStatusBarItem(...options as CreateStatusBarItemOptions);

    this.originalData = {
      accessibilityInformation: this.data.accessibilityInformation,
      backgroundColor: this.data.backgroundColor,
      color: this.data.color,
      command: this.data.command,
      name: this.data.name,
      text: this.data.text,
      tooltip: this.data.tooltip,
    };

    this.set(data);
  }

  reset(data: Partial<StatusBarItemData> = this.originalData) {
    this.set(data);
  }

  set(data: Partial<StatusBarItemData>) {
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

  dispose() {
    this.data.dispose();
  }

  hide() {
    this.data.hide();
  }

  show() {
    this.data.show();
  }
}
