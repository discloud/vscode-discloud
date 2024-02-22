import { TreeItem, TreeItemCollapsibleState, TreeItemLabel } from "vscode";
import { BaseChildTreeItemData } from "../@types";

export default class BaseChildTreeItem extends TreeItem {
  declare children: Map<string, TreeItem>;

  constructor(label: string | TreeItemLabel, collapsibleState?: TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }

  contextValue = "ChildTreeItem";

  protected _patch(data: Partial<BaseChildTreeItemData>) {
    if ("label" in data)
      this.label = data.label;

    if ("description" in data)
      this.description = data.description;

    this.tooltip = data.tooltip ?? this.description ? `${this.description}: ${this.label}` : `${this.label}`;

    if ("collapsibleState" in data)
      this.collapsibleState = data.collapsibleState;

    if (data.children) {
      if (data.children instanceof Map) {
        this.children = data.children;
      } else {
        this.children = new Map(data.children.map(child => [`${child.label}`, child]));
      }
    }
  }
}
