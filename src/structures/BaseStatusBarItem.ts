import { window, type ExtensionContext, type StatusBarItem } from "vscode";
import type { CreateStatusBarItemOptions, StatusBarItemData, StatusBarItemOptions } from "../@types";

export default abstract class BaseStatusBarItem implements StatusBarItem {
  constructor(readonly context: ExtensionContext, data: Partial<StatusBarItemOptions>) {
    context.subscriptions.push(this);

    const options = data.id ? [data.id, data.alignment, data.priority] as const : [data.alignment, data.priority] as const;
    this.item = window.createStatusBarItem(...options as CreateStatusBarItemOptions);

    this.defaults = {
      accessibilityInformation: this.item.accessibilityInformation,
      backgroundColor: this.item.backgroundColor,
      color: this.item.color,
      command: this.item.command,
      name: this.item.name,
      text: this.item.text,
      tooltip: this.item.tooltip,
    };

    this.set(data);
  }

  declare protected readonly defaults: StatusBarItemData;
  declare protected readonly item: StatusBarItem;

  reset() {
    this.set(this.defaults);
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

  get accessibilityInformation() { return this.item.accessibilityInformation; }
  set accessibilityInformation(accessibilityInformation) { this.item.accessibilityInformation = accessibilityInformation; }

  /** @readonly */
  get alignment() { return this.item.alignment; }

  get backgroundColor() { return this.item.backgroundColor; }
  set backgroundColor(backgroundColor) { this.item.backgroundColor = backgroundColor; }

  get color() { return this.item.color; }
  set color(color) { this.item.color = color; }

  get command() { return this.item.command; }
  set command(command) { this.item.command = command; }

  /** @readonly */
  get id() { return this.item.id; }

  get name() { return this.item.name; }
  set name(name) { this.item.name = name; }

  /** @readonly */
  get priority() { return this.item.priority; }

  get text() { return this.item.text; }
  set text(text) { this.item.text = text; }

  get tooltip() { return this.item.tooltip; }
  set tooltip(tooltip) { this.item.tooltip = tooltip; }

  dispose() { this.item.dispose(); }

  hide() { this.item.hide(); }

  show() { this.item.show(); }
}
