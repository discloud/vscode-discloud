import { type AppType } from "../@enum";
import { type UserAppChildTreeItemData } from "../@types";
import { getIconPath } from "../utils/utils";
import BaseChildTreeItem from "./BaseChildTreeItem";

export default class UserAppChildTreeItem extends BaseChildTreeItem {
  readonly iconName: string;
  readonly appId: string;
  declare online: boolean;
  declare readonly type: AppType;

  constructor(data: UserAppChildTreeItemData) {
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

  _patch(data: Partial<UserAppChildTreeItemData>) {
    if (!data) return this;

    super._patch(data);

    return this;
  }
}
