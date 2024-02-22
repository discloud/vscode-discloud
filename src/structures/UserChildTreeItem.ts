import { TreeItem } from "vscode";
import { UserTreeItemData } from "../@types";
import { getIconPath } from "../util";

export default class UserChildTreeItem extends TreeItem {
  iconName?: string;
  readonly userID: string;
  readonly children?: Map<string, TreeItem>;

  constructor(options: UserTreeItemData & { userID: string }) {
    super(options.label!, options.collapsibleState);
    this.description = options.description;
    this.iconName = options.iconName;
    this.tooltip = options.tooltip ?? `${this.description}: ${this.label}`;
    this.userID = options.userID;

    if (this.iconName)
      this.iconPath = getIconPath(this.iconName);

    if (options.children) {
      if (options.children instanceof Map) {
        this.children = options.children;
      } else {
        this.children = new Map(options.children.map(child => [`${child.label}`, child]));
      }
    }
  }

  contextValue = "ChildTreeItem";
}
