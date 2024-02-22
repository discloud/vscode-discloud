import { TreeItem } from "vscode";
import { AppChildTreeItemData } from "../@types";
import { JSONparse, getIconPath } from "../util";

export default class AppChildTreeItem extends TreeItem {
  readonly iconName: string;
  readonly appId: string;
  declare children?: Map<string, TreeItem>;

  constructor(data: AppChildTreeItemData) {
    super(data.label, data.collapsibleState);

    this.appId = data.appId;
    this.iconName = data.iconName;
    this.iconPath = getIconPath(this.iconName);

    this._patch(data);
  }

  _patch(data: Partial<AppChildTreeItemData>) {
    if ("label" in data)
      this.label = data.label;

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

    const values = this.contextValue.match(/([^\W]+)(?:\W(.*))?/) ?? [];
    const json = values[2] ? JSONparse<Record<string, any>>(values[2]) : null;

    this.contextValue = `${values[1]}.${JSON.stringify(Object.assign({}, json, {
      online: data.online ?? json?.online,
    }))}`;
  }

  contextValue = "ChildTreeItem";
}
