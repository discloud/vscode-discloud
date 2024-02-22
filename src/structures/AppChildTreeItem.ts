import { TreeItem } from "vscode";
import { AppType } from "../@enum";
import { AppChildTreeItemData } from "../@types";
import { getIconPath } from "../util";

export default class AppChildTreeItem extends TreeItem {
  readonly iconName: string;
  readonly appId: string;
  declare children?: Map<string, TreeItem>;
  readonly contextKey = "ChildTreeItem";
  declare online: boolean;
  declare readonly type: AppType;

  constructor(data: AppChildTreeItemData) {
    super(data.label, data.collapsibleState);

    this.appId = data.appId;
    this.type = data.appType;
    this.iconName = data.iconName;
    this.iconPath = getIconPath(this.iconName);

    this._patch(data);
  }

  get contextJSON() {
    return {
      online: this.online,
      type: this.type,
    };
  }

  _patch(data: Partial<AppChildTreeItemData>) {
    if ("label" in data)
      this.label = data.label;

    if ("online" in data)
      this.online = data.online!;

    if ("collapsibleState" in data)
      this.collapsibleState = data.collapsibleState;

    if ("description" in data)
      this.description = data.description;

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
