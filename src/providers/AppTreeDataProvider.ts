import { t } from "@vscode/l10n";
import { ApiStatusApp, ApiUploadApp, RESTGetApiAppStatusResult, Routes } from "discloud.app";
import { TreeItemCollapsibleState, window } from "vscode";
import { ApiVscodeApp, BaseApiApp } from "../@types";
import extension from "../extension";
import AppTreeItem from "../structures/AppTreeItem";
import { requester } from "../util";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class AppTreeDataProvider extends BaseTreeDataProvider<AppTreeItem> {
  constructor(viewId: string) {
    super(viewId);
  }

  private clean(data: (ApiUploadApp | ApiVscodeApp | BaseApiApp)[]) {
    for (const child of this.children.keys()) {
      if (!data.some(app => app.id === child)) {
        this.children.delete(child);
      }
    }
  }

  delete(id: string) {
    this.children.delete(id);
    this.refresh();
  }

  addRawApps(data: (ApiUploadApp | ApiVscodeApp)[]) {
    for (const app of data) {
      this.addRawApp(app);
    }
    this.clean(data);
    this.refresh();
  }

  addRawApp(data: (ApiUploadApp | ApiVscodeApp)) {
    const app = this.children.get(data.id) as AppTreeItem;
    if (app) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      app._patch(data);
    } else {
      this.children.set(data.id, new AppTreeItem({
        collapsibleState: this.children.size ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded,
        ...data,
      }));
    }
    this.refresh();
  }

  edit(appId: string, data: (ApiUploadApp | ApiVscodeApp | ApiStatusApp)) {
    const app = this.children.get(appId) as AppTreeItem;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    app?._patch(data);
  }

  async getStatus(appId: string) {
    const res = await requester<RESTGetApiAppStatusResult>(Routes.appStatus(appId));
    if (!res.apps) return;

    this.edit(appId, res.apps);
    this.refresh();
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
      label: "Nenhuma aplicação foi encontrada.",
      iconName: "x",
    }));
  }
}