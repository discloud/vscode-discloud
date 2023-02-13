import { TreeItem } from "vscode";
import { AppTreeItemData } from "../@types";
import { getIconPath } from "../util";

export default class AppChildTreeItem extends TreeItem {
  iconName?: string;
  appId?: string;
  children?: Map<string, TreeItem>;

  constructor(options: AppTreeItemData) {
    super(options.label, options.collapsibleState);
    this.description = options.description;
    this.iconName = options.iconName;
    this.tooltip = options.tooltip;
    this.appId = options.appId;
    if (this.iconName)
      this.iconPath = getIconPath(this.iconName);
    if (options.children)
      this.children = new Map(options.children.map((child: any) => [child.label, child]));
  }
}
