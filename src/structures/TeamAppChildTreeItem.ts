import { TreeItem } from "vscode";
import { TeamAppChildTreeItemData } from "../@types";
import { getIconPath } from "../util";

export default class TeamAppChildTreeItem extends TreeItem {
  declare iconName?: string;
  declare appId?: string;
  declare children?: Map<string, TreeItem>;

  constructor(options: TeamAppChildTreeItemData) {
    super(options.label, options.collapsibleState);
    this.description = options.description;
    this.iconName = options.iconName;
    this.tooltip = options.tooltip ?? this.description ? `${this.description}: ${this.label}` : `${this.label}`;
    this.appId = options.appId;
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
}
