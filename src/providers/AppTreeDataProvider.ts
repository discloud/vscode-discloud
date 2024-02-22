import { t } from "@vscode/l10n";
import { ApiStatusApp, BaseApiApp, RESTGetApiAppAllStatusResult, RESTGetApiAppStatusResult, Routes } from "discloud.app";
import { ProviderResult, TreeItem, TreeItemCollapsibleState, commands, window } from "vscode";
import { ApiVscodeApp } from "../@types";
import extension from "../extension";
import AppTreeItem from "../structures/AppTreeItem";
import { getIconPath, requester } from "../util";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class AppTreeDataProvider extends BaseTreeDataProvider<AppTreeItem> {
  constructor(viewId: string) {
    super(viewId);
  }

  getChildren(element?: NonNullable<AppTreeItem>): ProviderResult<any[]> {
    if (element) return Array.from(element.children.values());

    const children = Array.from(this.children.values());

    const sort = extension.config.get<string>("app.sort.by");

    if (sort?.includes(".")) {
      switch (sort) {
        case "id.asc":
          children.sort((a, b) => a.appId < b.appId ? -1 : 1);
          break;

        case "id.desc":
          children.sort((a, b) => a.appId > b.appId ? -1 : 1);
          break;

        case "memory.usage.asc":
          children.sort((a, b) => Number(a.data.memoryUsage) < Number(b.data.memoryUsage) ? -1 : 1);
          break;

        case "memory.usage.desc":
          children.sort((a, b) => Number(a.data.memoryUsage) > Number(b.data.memoryUsage) ? -1 : 1);
          break;

        case "name.asc":
          children.sort((a, b) => a.data.name < b.data.name ? -1 : 1);
          break;

        case "name.desc":
          children.sort((a, b) => a.data.name > b.data.name ? -1 : 1);
          break;

        case "started.asc":
          children.sort((a, b) => a.online &&
            (Number(a.data.startedAtTimestamp) < Number(b.data.startedAtTimestamp)) ? -1 : 1);
          break;

        case "started.desc":
          children.sort((a, b) => a.online &&
            (Number(a.data.startedAtTimestamp) > Number(b.data.startedAtTimestamp)) ? -1 : 1);
          break;
      }
    }

    if (extension.config.get<boolean>("app.sort.online")) {
      children.sort((a, b) => b.online ? 1 : a.online ? -1 : 0);
    }

    return children;
  }

  private cleanNonMatchedApps(data: (string | BaseApiApp)[]) {
    let refresh;

    const apps = data.map(app => typeof app === "string" ? app : app.id);

    for (const child of this.children.keys()) {
      if (!apps.includes(child)) {
        refresh = this.children.delete(child);
      }
    }

    if (refresh) this.refresh();
  }

  delete(id: string) {
    if (this.children.delete(id)) {
      if (!this.children.size)
        this.init();

      this.refresh();
    }
  }

  refresh(data: void | AppTreeItem | AppTreeItem[] | null | undefined) {
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

  addRawApp(data: ApiVscodeApp, returnBoolean?: boolean) {
    const existing = this.children.get(data.id);

    if (existing) {
      // @ts-expect-error ts(2445)
      const clone = existing._update(data);

      this.refresh(existing);

      extension.emit("appUpdate", clone, existing);
    } else {
      this.children.delete("x");

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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const clone = app._update(data);

      this.refresh(app);

      extension.emit("appUpdate", clone, app);
    }
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
              this.children.clear();
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
    this.children.clear();

    const x = new TreeItem(t("noappfound"));
    x.contextValue = "EmptyTreeItem";
    x.iconPath = getIconPath("x");

    this.children.set("x", <AppTreeItem>x);

    this.refresh();
  }
}
