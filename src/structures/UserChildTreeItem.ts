import { type ExtensionContext } from "vscode";
import type { UserTreeItemData } from "../@types";
import BaseChildTreeItem from "./BaseChildTreeItem";

export default class UserChildTreeItem extends BaseChildTreeItem {
  constructor(context: ExtensionContext, data: UserTreeItemData) {
    super(context, data.label, data.collapsibleState);

    this.userID = data.userID;

    this._patch(data);
  }

  readonly userID: string;

  _patch(data: Partial<UserTreeItemData>) {
    if (!data) return this;

    super._patch(data);

    return this;
  }
}
