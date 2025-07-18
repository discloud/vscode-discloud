import { t } from "@vscode/l10n";
import { TreeItemCollapsibleState } from "vscode";
import { AppType } from "../@enum";
import BaseTreeItem from "./BaseTreeItem";
import type UserAppTreeItem from "./UserAppTreeItem";

export default class AppTypeTreeItemView extends BaseTreeItem<UserAppTreeItem> {
  constructor(readonly type: AppType) {
    super(t(AppType[type]), TreeItemCollapsibleState.Expanded);
    this.contextValue = this.contextKey;
  }

  readonly contextKey = "TreeView";

  dispose(): void;
  dispose(key: string): boolean;
  dispose(key?: string) {
    if (key) {
      const removed = this.children.dispose(key);
      if (removed) this.refresh();
      return removed;
    }
    super.dispose();
  }

  refresh() {
    this.label = `${t(AppType[this.type])} (${this.children.size})`;
  }

  set(key: string, app: UserAppTreeItem) {
    this.children.set(key, app);
    this.refresh();
  }
}
