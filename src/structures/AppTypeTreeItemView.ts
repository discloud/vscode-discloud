import { TreeItemCollapsibleState } from "vscode";
import { AppType } from "../@enum";
import type AppTreeItem from "./AppTreeItem";
import BaseTreeItem from "./BaseTreeItem";

export default class AppTypeTreeItemView extends BaseTreeItem<AppTreeItem> {
  constructor(readonly type: AppType) {
    super(AppType[type], TreeItemCollapsibleState.Expanded);
  }

  dispose(): void;
  dispose(key: string): boolean;
  dispose(key?: string) {
    if (key) return this.children.dispose(key);
    super.dispose();
  }
}
