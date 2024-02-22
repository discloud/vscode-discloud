import { UserTreeItemData } from "../@types";
import BaseChildTreeItem from "./BaseChildTreeItem";

export default class UserChildTreeItem extends BaseChildTreeItem {
  readonly userID: string;
  declare iconName?: string;

  constructor(data: UserTreeItemData) {
    super(data.label, data.collapsibleState);

    this.userID = data.userID;

    this._patch(data);
  }

  _patch(data: Partial<UserTreeItemData>) {
    super._patch(data);
  }
}
