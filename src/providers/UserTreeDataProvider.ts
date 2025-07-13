import { type ExtensionContext } from "vscode";
import UserTreeItem from "../structures/UserTreeItem";
import type VSUser from "../structures/VSUser";
import { TreeViewIds } from "../utils/constants";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

type Item = UserTreeItem

export default class UserTreeDataProvider extends BaseTreeDataProvider<Item> {
  constructor(context: ExtensionContext) {
    super(context, TreeViewIds.discloudUser);
  }

  clear() {
    this.children.dispose();
    this.refresh();
  }

  add(user: VSUser) {
    this.children.set(`${user.userID}`, new UserTreeItem(user));
    this.refresh();
  }

  set(user: VSUser) {
    this.children.clear();
    this.children.set(`${user.userID}`, new UserTreeItem(user));
    this.refresh();
  }
}
