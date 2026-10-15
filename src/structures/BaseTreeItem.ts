import { TreeItem, type Disposable, type TreeItemCollapsibleState, type TreeItemLabel } from "vscode";
import type ExtensionCore from "../core";
import DisposableMap from "./DisposableMap";

const _defaultContextJSON: Record<any, any> = {};

export default abstract class BaseTreeItem<T extends TreeItem & Disposable> extends TreeItem implements Disposable {
  constructor(readonly core: ExtensionCore, label: string | TreeItemLabel, collapsibleState?: TreeItemCollapsibleState) {
    super(label, collapsibleState);
    this.contextValue = this.contextKey;
  }

  readonly contextKey: string = "TreeItem";
  declare readonly data: unknown;
  readonly children = new DisposableMap<string, T>();

  get contextJSON(): Record<any, any> { return _defaultContextJSON; }

  protected _upgradeContextValue() {
    this.contextValue = this.contextKey;
  }

  dispose() {
    this.children.dispose();
  }

  protected _clone(): this {
    return Object.assign(Object.create(this), this);
  }

  protected _patch(data: unknown): this;
  protected _patch(data: any): this {
    if (data == null) return this;

    Object.assign(<any>this.data, data);

    if (data.accessibilityInformation !== undefined) this.accessibilityInformation = data.accessibilityInformation;

    if (data.checkboxState !== undefined) this.checkboxState = data.checkboxState;

    if (data.collapsibleState !== undefined) this.collapsibleState = data.collapsibleState;

    if (data.command !== undefined) this.command = data.command;

    if (data.description !== undefined) this.description = data.description;

    if (data.iconPath !== undefined) this.iconPath = data.iconPath;

    if (data.label !== undefined) this.label = data.label;

    if (data.resourceUri !== undefined) this.resourceUri = data.resourceUri;

    if (data.tooltip !== undefined) this.tooltip = data.tooltip;

    return this;
  }

  protected _update(data: unknown): this {
    const clone = this._clone();
    this._patch(data);
    return clone;
  }
}
