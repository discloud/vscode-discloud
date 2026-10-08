import type { ApiVscodeUser } from "../@types";
import type ExtensionCore from "../core/extension";
import UserTreeItem from "../structures/UserTreeItem";
import { TreeViewIds } from "../utils/constants";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

type Item = UserTreeItem

export default class UserTreeDataProvider extends BaseTreeDataProvider<Item> {
  constructor(core: ExtensionCore) {
    super(core, TreeViewIds.discloudUser);
  }

  clear() {
    this.children.dispose();
    this.refresh();
  }

  delete(userId: string) {
    this.children.delete(`${userId}`);
    this.refresh();
  }

  add(user: ApiVscodeUser) {
    this.children.set(`${user.userID}`, new UserTreeItem(this.core, user));
    this.refresh();
  }

  set(user: ApiVscodeUser) {
    this.children.dispose();
    this.children.set(`${user.userID}`, new UserTreeItem(this.core, user));
    this.refresh();
  }
}
