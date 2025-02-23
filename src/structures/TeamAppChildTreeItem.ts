import { type AppType } from "../@enum";
import { type TeamAppChildTreeItemData } from "../@types";
import BaseChildTreeItem from "./BaseChildTreeItem";

export default class TeamAppChildTreeItem extends BaseChildTreeItem {
  readonly iconName?: string;
  readonly appId: string;
  type: AppType | null = null;
  online: boolean | null = null;

  constructor(data: TeamAppChildTreeItemData) {
    super(data.label, data.collapsibleState);
    this.iconName = data.iconName;
    this.appId = data.appId;

    this._patch(data);
  }

  get contextJSON() {
    return {
      online: this.online,
      type: this.type,
    };
  }

  _patch(data: Partial<TeamAppChildTreeItemData>) {
    if (!data) return this;

    super._patch(data);

    if (data.appType !== undefined) this.type = data.appType;

    if (data.online !== undefined) this.online = data.online;

    this.tooltip = data.tooltip ?? this.description ? `${this.description}: ${this.label}` : `${this.label}`;

    return this;
  }
}
