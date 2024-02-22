import { TreeItem, TreeItemCollapsibleState, TreeItemLabel } from "vscode";
import { BaseChildTreeItemData } from "../@types";

export default class BaseChildTreeItem extends TreeItem {
  declare children: Map<string, TreeItem>;
  readonly contextKey = "ChildTreeItem";
  contextValue = this.contextKey;

  constructor(label: string | TreeItemLabel, collapsibleState?: TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }

  get contextJSON(): Record<any, any> {
    return {};
  }

  protected _patch(data: Partial<BaseChildTreeItemData>) {
    if ("accessibilityInformation" in data)
      this.accessibilityInformation = data.accessibilityInformation;

    if ("checkboxState" in data)
      this.checkboxState = data.checkboxState;

    if ("collapsibleState" in data)
      this.collapsibleState = data.collapsibleState;

    if ("command" in data)
      this.command = data.command;

    if ("description" in data)
      this.description = data.description;

    if ("iconPath" in data)
      this.iconPath = data.iconPath;

    if ("label" in data)
      this.label = data.label;

    if ("resourceUri" in data)
      this.resourceUri = data.resourceUri;

    this.tooltip = data.tooltip ?? this.description ? `${this.description}: ${this.label}` : `${this.label}`;

    if (data.children) {
      if (data.children instanceof Map) {
        this.children = data.children;
      } else {
        this.children = new Map(data.children.map(child => [`${child.label}`, child]));
      }
    }

    this.contextValue = `${this.contextKey}.${JSON.stringify(this.contextJSON)}`;
  }
}
