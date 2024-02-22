import { AppType } from "../@enum";
import { AppChildTreeItemData } from "../@types";
import { getIconPath } from "../util";
import BaseChildTreeItem from "./BaseChildTreeItem";

export default class AppChildTreeItem extends BaseChildTreeItem {
  readonly iconName: string;
  readonly appId: string;
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
    super._patch(data);

    this.contextValue = `${this.contextKey}.${JSON.stringify(this.contextJSON)}`;
  }
}
