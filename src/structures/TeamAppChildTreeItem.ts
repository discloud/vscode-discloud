import { TreeItem } from "vscode";
import { AppType } from "../@enum";
import { TeamAppChildTreeItemData } from "../@types";

export default class TeamAppChildTreeItem extends TreeItem {
  readonly iconName?: string;
  readonly appId: string;
  declare children: Map<string, TreeItem>;
  readonly contextKey = "ChildTreeItem";
  type: AppType | null = null;

  constructor(data: TeamAppChildTreeItemData) {
    super(data.label, data.collapsibleState);
    this.iconName = data.iconName;
    this.appId = data.appId;

    this._patch(data);
  }

  get contextJSON() {
    return {
      type: this.type,
    };
  }

  _patch(data: Partial<TeamAppChildTreeItemData>) {
    if ("label" in data)
      this.label = data.label;

    if ("collapsibleState" in data)
      this.collapsibleState = data.collapsibleState;

    if ("description" in data)
      this.description = data.description;

    if (data.children) {
      if (data.children instanceof Map) {
        this.children = data.children;
      } else {
        this.children = new Map(data.children.map(child => [`${child.label}`, child]));
      }
    }

    this.tooltip = data.tooltip ?? this.description ? `${this.description}: ${this.label}` : `${this.label}`;

    this.contextValue = `${this.contextKey}.${JSON.stringify(this.contextJSON)}`;
  }
}
