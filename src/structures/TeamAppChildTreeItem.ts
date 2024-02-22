import { AppType } from "../@enum";
import { TeamAppChildTreeItemData } from "../@types";
import BaseChildTreeItem from "./BaseChildTreeItem";

export default class TeamAppChildTreeItem extends BaseChildTreeItem {
  readonly iconName?: string;
  readonly appId: string;
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
    super._patch(data);

    this.tooltip = data.tooltip ?? this.description ? `${this.description}: ${this.label}` : `${this.label}`;
  }
}
