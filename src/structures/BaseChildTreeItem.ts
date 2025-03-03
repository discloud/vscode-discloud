import { type Disposable, TreeItem, type TreeItemCollapsibleState, type TreeItemLabel } from "vscode";
import { type BaseChildTreeItemData } from "../@types";

export default class BaseChildTreeItem extends TreeItem implements Disposable {
  readonly contextKey = "ChildTreeItem";
  contextValue = this.contextKey;

  constructor(label: string | TreeItemLabel, collapsibleState?: TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }

  get contextJSON(): Record<any, any> {
    return {};
  }

  dispose() { }

  protected _patch(data: Partial<BaseChildTreeItemData>) {
    if (!data) return this;

    if (data.accessibilityInformation !== undefined) this.accessibilityInformation = data.accessibilityInformation;

    if (data.checkboxState !== undefined) this.checkboxState = data.checkboxState;

    if (data.collapsibleState !== undefined) this.collapsibleState = data.collapsibleState;

    if (data.command !== undefined) this.command = data.command;

    if (data.description !== undefined) this.description = data.description;

    if (data.iconPath !== undefined) this.iconPath = data.iconPath;

    if (data.label !== undefined) this.label = data.label;

    if (data.resourceUri !== undefined) this.resourceUri = data.resourceUri;

    this.tooltip = data.tooltip ?? this.description ? `${this.description}: ${this.label}` : `${this.label}`;

    this.contextValue = `${this.contextKey}.${JSON.stringify(this.contextJSON)}`;

    return this;
  }
}
