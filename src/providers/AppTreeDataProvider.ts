import { t } from "@vscode/l10n";
import { type ApiStatusApp, type BaseApiApp, type RESTGetApiAppStatusResult, Routes } from "discloud.app";
import { type ExtensionContext, type ProviderResult, type TreeItem, commands, window } from "vscode";
import { type AppType } from "../@enum";
import { type ApiVscodeApp } from "../@types";
import extension from "../extension";
import AppTreeItem from "../structures/AppTreeItem";
import AppTypeTreeItemView from "../structures/AppTypeTreeItemView";
import DisposableMap from "../structures/DisposableMap";
import EmptyAppListTreeItem from "../structures/EmptyAppListTreeItem";
import { ConfigKeys, SortBy, TreeViewIds } from "../util/constants";
import { compareBooleans, compareNumbers } from "../util/utils";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

type Item = AppTreeItem

export default class AppTreeDataProvider extends BaseTreeDataProvider<Item> {
  constructor(context: ExtensionContext) {
    super(context, TreeViewIds.discloudUserApps);

    context.subscriptions.push(this._views);
  }

  protected readonly _views = new DisposableMap<AppType, AppTypeTreeItemView>();

  protected _getView(type: AppType) {
    let view = this._views.get(type);
    if (view) return view;
    view = new AppTypeTreeItemView(type);
    this._views.set(type, view);
    return view;
  }

  protected _sort(children: Item[]) {
    const sort = extension.config.get<string>(ConfigKeys.appSortBy);

    if (!sort) return this._sortOnline(children);

    switch (sort) {
      case SortBy.none: break;

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

    this._sortOnline(children);
  }

  protected _sortOnline(children: Item[]) {
    const sortOnlineFirst = extension.config.get<boolean>(ConfigKeys.appSortOnline);
    if (sortOnlineFirst) children.sort((a, b) => compareBooleans(a.online, b.online));
  }

  getChildren(element?: AppTreeItem): ProviderResult<AppTreeItem[]>;
  getChildren(element?: AppTypeTreeItemView): ProviderResult<AppTypeTreeItemView[]>;
  getChildren(element?: AppTreeItem | AppTypeTreeItemView): ProviderResult<TreeItem[]> {
    if (element) {
      if (element instanceof AppTypeTreeItemView) {
        const children = element.children.values().toArray();
        this._sort(children);

        return children;
      }

      return element.children.values().toArray();
    }

    const separate = extension.config.get(ConfigKeys.appSeparateByType, true);

    if (separate) return this._views.values().toArray().sort((a, b) => a.children.size - b.children.size);

    const children = this.children.values().toArray();
    this._sort(children);

    return children;
  }

  private cleanNonMatchedApps(data: (string | BaseApiApp)[]) {
    let refresh;

    const apps = new Set(data.map(app => typeof app === "string" ? app : app.id));

    for (const key of this.children.keys()) {
      if (apps.has(key)) continue;

      const child = this.children.get(key);
      if (!child) continue;

      refresh = this.children.dispose(key);

      const view = this._views.get(child.type);
      if (!view) continue;

      view.dispose(key);

      if (!view.children.size) this._views.dispose(view.type);
    }

    if (refresh) this.refresh();
  }

  delete(id: string) {
    const child = this.children.get(id);

    if (!child) return;

    const view = this._views.get(child.type);

    if (view) {
      view.dispose(id);

      if (!view.children.size) this._views.dispose(view.type);
    }

    this.children.dispose(id);

    if (!this.children.size) this.init();

    this.refresh();
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

      const child = new AppTreeItem(data);

      this._getView(child.type).set(child.appId, child);

      this.children.set(child.appId, child);

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

      extension.emit("appUpdate", clone, app);

      this.refresh(app);

      return true;
    }

    return false;
  }

  async getStatus(appId: string) {
    const response = await extension.api.queueGet<RESTGetApiAppStatusResult>(Routes.appStatus(appId));

    if (!response) return;

    if (!response.apps) {
      if ("statusCode" in response) {
        switch (response.statusCode) {
          case 404:
            this.delete(appId);
            break;
        }
      }

      return;
    }

    this.editRawApp(appId, response.apps);
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
    this._views.dispose();
    this.children.dispose();

    this.children.set("x", new EmptyAppListTreeItem() as Item);

    this.refresh();
  }
}
