import { type ExtensionContext } from "vscode";
import UserTreeItem from "../structures/UserTreeItem";
import type VSUser from "../structures/VSUser";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class UserTreeDataProvider extends BaseTreeDataProvider<UserTreeItem> {
  constructor(context: ExtensionContext) {
    super(context, "discloud-user");
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
