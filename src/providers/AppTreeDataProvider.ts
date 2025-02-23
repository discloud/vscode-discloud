import { t } from "@vscode/l10n";
import { type ApiStatusApp, type BaseApiApp, type RESTGetApiAppAllStatusResult, type RESTGetApiAppStatusResult, Routes } from "discloud.app";
import { type ProviderResult, TreeItem, TreeItemCollapsibleState, commands, window } from "vscode";
import { type ApiVscodeApp } from "../@types";
import extension from "../extension";
import { requester } from "../services/discloud";
import AppTreeItem from "../structures/AppTreeItem";
import { compareBooleans, compareNumbers, getIconPath } from "../util";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class AppTreeDataProvider extends BaseTreeDataProvider<AppTreeItem> {
  constructor() {
    super("discloud-apps");
  }

  getChildren(element?: AppTreeItem): ProviderResult<AppTreeItem[]>;
  getChildren(element?: NonNullable<AppTreeItem>): ProviderResult<TreeItem[]> {
    if (element) return Array.from(element.children.values());

    const children = Array.from(this.children.values());

    const sort = extension.config.get<string>("app.sort.by");

    if (sort?.includes(".")) {
      switch (sort) {
        case "id.asc":
          children.sort((a, b) => a.appId.localeCompare(b.appId));
          break;

        case "id.desc":
          children.sort((a, b) => b.appId.localeCompare(a.appId));
          break;

        case "memory.usage.asc":
          children.sort((a, b) => compareNumbers(Number(a.data.memoryUsage), Number(b.data.memoryUsage)));
          break;

        case "memory.usage.desc":
          children.sort((a, b) => compareNumbers(Number(b.data.memoryUsage), Number(a.data.memoryUsage)));
          break;

        case "name.asc":
          children.sort((a, b) => a.data.name.localeCompare(b.data.name));
          break;

        case "name.desc":
          children.sort((a, b) => b.data.name.localeCompare(a.data.name));
          break;

        case "started.asc":
          children.sort((a, b) => a.online || b.online
            ? compareNumbers(Number(a.data.startedAtTimestamp), Number(b.data.startedAtTimestamp))
            : 0);
          break;

        case "started.desc":
          children.sort((a, b) => a.online || b.online
            ? compareNumbers(Number(b.data.startedAtTimestamp), Number(a.data.startedAtTimestamp))
            : 0);
          break;
      }
    }

    const sortOnlineFirst = extension.config.get<boolean>("app.sort.online");

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

  refresh(data?: AppTreeItem | AppTreeItem[] | null) {
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
    const res = await requester<
      | RESTGetApiAppStatusResult
      | RESTGetApiAppAllStatusResult
    >(Routes.appStatus(appId), {}, true);

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

    const x = new TreeItem(t("no.app.found"));
    x.contextValue = "EmptyTreeItem";
    x.iconPath = getIconPath("x");

    this.children.set("x", <AppTreeItem>x);

    this.refresh();
  }
}
