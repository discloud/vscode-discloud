import { TreeItem } from "vscode";
import { UserTreeItemData } from "../@types";
import { getIconPath } from "../util";

export default class UserChildTreeItem extends TreeItem {
  readonly userID: string;
  declare iconName?: string;
  declare children?: Map<string, TreeItem>;

  constructor(data: UserTreeItemData) {
    super(data.label, data.collapsibleState);

    this.userID = data.userID;

    this._patch(data);
  }

  _patch(data: Partial<UserTreeItemData>) {
    if ("description" in data)
      this.description = data.description;

    if ("iconName" in data)
      this.iconName = data.iconName;

    this.tooltip = data.tooltip ??= `${this.description}: ${this.label}`;

    if (this.iconName)
      this.iconPath = getIconPath(this.iconName);

    if (data.children) {
      if (data.children instanceof Map) {
        this.children = data.children;
      } else {
        this.children = new Map(data.children.map(child => [`${child.label}`, child]));
      }
    }
  }

  contextValue = "ChildTreeItem";
}
