import { t } from "@vscode/l10n";
import { ThemeIcon, TreeItemCollapsibleState, Uri } from "vscode";
import { AppType } from "../@enum";
import BaseTreeItem from "./BaseTreeItem";
import type UserAppTreeItem from "./UserAppTreeItem";
import path from "path";

export default class AppTypeTreeItemView extends BaseTreeItem<UserAppTreeItem> {
  constructor(readonly type: AppType) {
    super(t(AppType[type]), TreeItemCollapsibleState.Expanded);
    this.contextValue = this.contextKey;
    this.iconPath = this.getTypeIcon();
    this.refresh();
  }

  readonly contextKey = "TreeView";

  private getTypeIcon() {
    if (this.type === AppType.site) {
      return new ThemeIcon("globe");
    }

    return {
      light: Uri.file(path.join(__dirname, "../resources/light/bot.svg")),
      dark: Uri.file(path.join(__dirname, "../resources/dark/bot.svg")),
    };
  }

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
    this.label = t(AppType[this.type]);
    this.description = `${this.children.size}`;
    this.iconPath = this.getTypeIcon();
  }

  set(key: string, app: UserAppTreeItem) {
    this.children.set(key, app);
    this.refresh();
  }
}
