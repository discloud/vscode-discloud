import { t } from "@vscode/l10n";
import { RESTGetApiAppStatusResult, Routes } from "discloud.app";
import { TreeItemCollapsibleState, window } from "vscode";
import { BaseApiApp } from "../@types";
import extension from "../extension";
import AppTreeItem from "../structures/AppTreeItem";
import { requester } from "../util";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class AppTreeDataProvider extends BaseTreeDataProvider<AppTreeItem> {
  constructor(viewId: string) {
    super(viewId);
  }

  private clean(data: BaseApiApp[]) {
    let refresh;

    for (const child of this.children.keys()) {
      if (data.every(app => app.id !== child)) {
        refresh = this.children.delete(child);
      }
    }

    if (refresh)
      this.refresh();
  }

  delete(id: string) {
    if (this.children.delete(id)) {
      if (!this.children.size)
        this.init();

      this.refresh();
    }
  }

  setRawApps(data: BaseApiApp[]) {
    this.clean(data);

    let refresh;

    for (const app of data) {
      if (this.addRawApp(app, true))
        refresh = true;
    }

    if (!this.children.size)
      this.init();

    if (refresh)
      this.refresh();
  }

  addRawApp(data: BaseApiApp, returnBoolean?: boolean) {
    const app = this.children.get(data.id);

    if (app) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.refresh(app._patch(data));
    } else {
      this.children.delete("x");

      this.children.set(data.id, new AppTreeItem({
        collapsibleState: this.children.size ?
          TreeItemCollapsibleState.Collapsed :
          TreeItemCollapsibleState.Expanded,
        ...data,
      }));

      if (returnBoolean) {
        return true;
      } else {
        this.refresh();
      }
    }
  }

  edit(appId: string, data: BaseApiApp) {
    const app = this.children.get(appId);

    if (app) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.refresh(app._patch(data));
    }
  }

  async getStatus(appId: string) {
    const res = await requester<RESTGetApiAppStatusResult>(Routes.appStatus(appId));

    if (!res.apps) {
      if ("statusCode" in res) {
        switch (res.statusCode) {
          case 404:
            this.delete(appId);
            break;
        }
      }

      return;
    }

    this.edit(appId, res.apps);
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

    this.children.set("x", new AppTreeItem({
      label: t("noappfound"),
      iconName: "x",
    }));

    this.refresh();
  }
}