import UserTreeItem from "../structures/UserTreeItem";
import VSUser from "../structures/VSUser";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class UserTreeDataProvider extends BaseTreeDataProvider {
  constructor(viewId: string) {
    super(viewId);
  }

  update(user: VSUser) {
    this.children.clear();
    this.children.set(user.userID!, new UserTreeItem(user));
    this.refresh();
  }
}