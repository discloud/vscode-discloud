import { TreeItem } from "vscode";
import { TeamAppChildTreeItemData } from "../@types";

export default class TeamAppChildTreeItem extends TreeItem {
  readonly iconName?: string;
  readonly appId: string;
  declare children: Map<string, TreeItem>;

  constructor(data: TeamAppChildTreeItemData) {
    super(data.label, data.collapsibleState);
    this.iconName = data.iconName;
    this.appId = data.appId;

    this._patch(data);
  }

  _patch(data: Partial<TeamAppChildTreeItemData>) {
    this.description = data.description;

    if (data.children) {
      if (data.children instanceof Map) {
        this.children = data.children;
      } else {
        this.children = new Map(data.children.map(child => [`${child.id}`, child]));
      }
    }

    this.tooltip = data.tooltip ?? this.description ? `${this.description}: ${this.label}` : `${this.label}`;
  }

  contextValue = "ChildTreeItem";
}
