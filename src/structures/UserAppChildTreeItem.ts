import { type ExtensionContext } from "vscode";
import { type AppType } from "../@enum";
import type { UserAppChildTreeItemData } from "../@types";
import BaseChildTreeItem from "./BaseChildTreeItem";

export default class UserAppChildTreeItem extends BaseChildTreeItem {
  readonly iconName: string;
  readonly appId: string;
  declare online: boolean;
  declare readonly type: AppType;

  constructor(context: ExtensionContext, data: UserAppChildTreeItemData) {
    super(context, data.label, data.collapsibleState);

    this.appId = data.appId;
    this.type = data.appType;
    this.iconName = data.iconName;
    this.iconPath = this.context.iconPath(this.iconName);

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
