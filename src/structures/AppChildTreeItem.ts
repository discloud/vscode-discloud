import { TreeItem } from "vscode";
import { AppTreeItemData } from "../@types";
import { JSONparse, getIconPath } from "../util";

export default class AppChildTreeItem extends TreeItem {
  iconName?: string;
  readonly appId: string;
  readonly children?: Map<string, TreeItem>;

  constructor(options: AppTreeItemData & { appId: string, online: boolean }) {
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

    const values = this.contextValue.match(/([^\W]+)(?:\W(.*))?/) ?? [];
    const json = values[2] ? JSONparse(values[2]) : null;

    this.contextValue = `${values[1]}.${JSON.stringify(Object.assign({}, json, { online: options.online }))}`;
  }

  contextValue = "ChildTreeItem";
}
