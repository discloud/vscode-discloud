import { t } from "@vscode/l10n";
import { type ProviderResult, window } from "vscode";
import { type ApiVscodeApp } from "../@types";
import type ExtensionCore from "../core/extension";
import EmptyAppListTreeItem from "../structures/EmptyAppListTreeItem";
import SnapshotAppTreeItem from "../structures/SnapshotAppTreeItem";
import { EMPTY_TREE_ITEM_ID, TreeViewIds } from "../utils/constants";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

type Item = SnapshotAppTreeItem

export default class SnapshotTreeDataProvider extends BaseTreeDataProvider<Item> {
  constructor(readonly core: ExtensionCore) {
    super(core.context, TreeViewIds.discloudSnapshots);
  }

  getChildren(element?: SnapshotAppTreeItem): ProviderResult<any[]> {
    if (element) {
      return element.fetch(this.core).then(children => {
        this.refresh(element);
        return children;
      });
    }

    return this.children.values().toArray();
  }

  refresh(data?: Item | Item[] | null) {
    super.refresh(data);
  }

  clear() {
    this.children.dispose();
    this.refresh();
  }

  setRawApps(data: ApiVscodeApp[]) {
    this.children.dispose();

    if (!data.length) {
      this.children.set(EMPTY_TREE_ITEM_ID, new EmptyAppListTreeItem() as Item);
      this.refresh();
      return;
    }

    for (const app of data) {
      this.children.set(app.id, SnapshotAppTreeItem.fromApp(app));
    }

    this.refresh();
  }

  async fetch() {
    await window.withProgress({
      location: { viewId: this.viewId },
      title: t("refreshing"),
    }, async () => {
      this.core.statusBar.setLoading();
      await this.core.user.fetch(true);
      this.core.statusBar.reset();
    });
  }

  async refreshApp(appId: string) {
    const item = this.children.get(appId);
    if (!item) return;
    await item.fetch(this.core, true);
    this.refresh(item);
  }
}
