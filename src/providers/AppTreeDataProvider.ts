import { t } from "@vscode/l10n";
import { type ApiStatusApp, type BaseApiApp, type RESTGetApiAppAllStatusResult, type RESTGetApiAppStatusResult, Routes } from "discloud.app";
import { type ExtensionContext, type ProviderResult, TreeItem, TreeItemCollapsibleState, commands, window } from "vscode";
import { type ApiVscodeApp } from "../@types";
import extension from "../extension";
import AppTreeItem from "../structures/AppTreeItem";
import { ConfigKeys, SortBy, TreeViewIds } from "../util/constants";
import { compareBooleans, compareNumbers, getIconPath } from "../util/utils";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

type Item = AppTreeItem

export default class AppTreeDataProvider extends BaseTreeDataProvider<Item> {
  constructor(context: ExtensionContext) {
    super(context, TreeViewIds.discloudUserApps);
  }

  getChildren(element?: Item): ProviderResult<Item[]>;
  getChildren(element?: AppTreeItem): ProviderResult<TreeItem[]> {
    if (element) return Array.from(element.children.values());

    const children = Array.from(this.children.values());

    const sort = extension.config.get<string>(ConfigKeys.appSortBy);

    if (sort?.includes(".")) {
      switch (sort) {
        case SortBy.idAsc:
          children.sort((a, b) => a.appId.localeCompare(b.appId));
          break;

        case SortBy.idDesc:
          children.sort((a, b) => b.appId.localeCompare(a.appId));
          break;

        case SortBy.memoryUsageAsc:
          children.sort((a, b) => compareNumbers(Number(a.data.memoryUsage), Number(b.data.memoryUsage)));
          break;

        case SortBy.memoryUsageDesc:
          children.sort((a, b) => compareNumbers(Number(b.data.memoryUsage), Number(a.data.memoryUsage)));
          break;

        case SortBy.nameAsc:
          children.sort((a, b) => a.data.name.localeCompare(b.data.name));
          break;

        case SortBy.nameDesc:
          children.sort((a, b) => b.data.name.localeCompare(a.data.name));
          break;

        case SortBy.startedAsc:
          children.sort((a, b) => a.online || b.online
            ? compareNumbers(Number(a.data.startedAtTimestamp), Number(b.data.startedAtTimestamp))
            : 0);
          break;

        case SortBy.startedDesc:
          children.sort((a, b) => a.online || b.online
            ? compareNumbers(Number(b.data.startedAtTimestamp), Number(a.data.startedAtTimestamp))
            : 0);
          break;
      }
    }

    const sortOnlineFirst = extension.config.get<boolean>(ConfigKeys.appSortOnline);

    if (sortOnlineFirst) children.sort((a, b) => compareBooleans(a.online, b.online));

    return children;
  }

  private cleanNonMatchedApps(data: (string | BaseApiApp)[]) {
    let refresh;

    const apps = new Set(data.map(app => typeof app === "string" ? app : app.id));

    for (const key of this.children.keys()) {
      if (!apps.has(key)) {
        refresh = this.children.dispose(key);
      }
    }

    if (refresh) this.refresh();
  }

  delete(id: string) {
    if (this.children.dispose(id)) {
      if (!this.children.size)
        this.init();

      this.refresh();
    }
  }

  refresh(data?: Item | Item[] | null) {
    commands.executeCommand("setContext", "discloudAppLength", this.children.has("x") ? 0 : this.children.size);
    super.refresh(data);
  }

  setRawApps(data: ApiVscodeApp[]) {
    this.cleanNonMatchedApps(data);

    let refresh;

    for (const app of data) {
      if (this.addRawApp(app, true))
        refresh = true;
    }

    if (!this.children.size)
      this.init();

    if (refresh) this.refresh();
  }

  addRawApp(data: ApiVscodeApp): void
  addRawApp(data: ApiVscodeApp, returnBoolean: true): boolean
  addRawApp(data: ApiVscodeApp, returnBoolean?: boolean) {
    const existing = this.children.get(data.id);

    if (existing) {
      // @ts-expect-error ts(2445)
      const clone = existing._update(data);

      this.refresh(existing);

      extension.emit("appUpdate", clone, existing);

      if (returnBoolean) return false;
    } else {
      this.children.dispose("x");

      this.children.set(data.id, new AppTreeItem(Object.assign({
        collapsibleState: this.children.size ?
          TreeItemCollapsibleState.Collapsed :
          TreeItemCollapsibleState.Expanded,
      }, data)));

      if (returnBoolean) {
        return true;
      } else {
        this.refresh();
      }
    }
  }

  editRawApp(appId: string, data: Partial<ApiVscodeApp & ApiStatusApp>) {
    const app = this.children.get(appId);

    if (app) {
      // @ts-expect-error ts(2445)
      const clone = app._update(data);

      this.refresh(app);

      extension.emit("appUpdate", clone, app);

      return true;
    }

    return false;
  }

  async getStatus(appId: string = "all") {
    const res = await extension.api.queueGet<
      | RESTGetApiAppStatusResult
      | RESTGetApiAppAllStatusResult
    >(Routes.appStatus(appId), {});

    if (!res) return;

    if (!res.apps) {
      if ("statusCode" in res) {
        switch (res.statusCode) {
          case 404:
            if (appId === "all") {
              this.init();
            } else {
              this.delete(appId);
            }
            break;
        }
      }

      return;
    }

    if (Array.isArray(res.apps)) {
      for (const app of res.apps) {
        this.editRawApp(app.id, app);
      }
    } else {
      this.editRawApp(appId, res.apps);
    }
  }

  async fetch() {
    await window.withProgress({
      location: { viewId: this.viewId },
      title: t("refreshing"),
    }, async () => {
      extension.statusBar.setLoading();
      await extension.user.fetch(true);
      extension.statusBar.reset();
    });
  }

  init() {
    this.children.dispose();

    const x = new TreeItem(t("no.app.found")) as Item;
    x.contextValue = "EmptyTreeItem";
    x.iconPath = getIconPath("x");

    this.children.set("x", x);

    this.refresh();
  }
}
