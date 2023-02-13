import { t } from "@vscode/l10n";
import { ApiUploadApp, BaseApiApp, RESTGetApiAppAllStatusResult, RESTGetApiAppStatusResult, RESTGetApiTeamResult, Routes } from "discloud.app";
import { TreeItemCollapsibleState, window } from "vscode";
import { ApiVscodeApp } from "../@types";
import TeamAppTreeItem from "../structures/TeamAppTreeItem";
import { requester } from "../util";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class TeamAppTreeDataProvider extends BaseTreeDataProvider {
  constructor(viewId: string) {
    super(viewId);
  }

  async getApps() {
    const response = await requester<RESTGetApiTeamResult>("/team", {}, true);

    if (response?.status !== "ok") return;

    this.clean(response.apps);

    for (const app of response.apps) {
      const oldApp = this.children.get(app.id) as TeamAppTreeItem;

      if (oldApp) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        oldApp._patch(app);
      } else {
        this.children.set(app.id, new TeamAppTreeItem({
          collapsibleState: this.children.size ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded,
          ...app,
        }));
      }
    }

    if (this.children.size) {
      this.refresh();
      await window.withProgress({
        location: { viewId: this.viewId },
        title: t("refreshing"),
      }, async () => {
        await this.getStatus();
      });
    } else {
      this.init();
    }
  }

  async getStatus(appId: string = "all") {
    const res = await requester<
      RESTGetApiAppStatusResult |
      RESTGetApiAppAllStatusResult
    >(Routes.teamStatus(appId), {}, true);

    if (res?.status !== "ok") return;

    if (Array.isArray(res.apps)) {
      for (const app of res.apps) {
        const oldApp = this.children.get(app.id) as TeamAppTreeItem;

        if (oldApp) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          oldApp._patch(app);
        } else {
          this.children.set(app.id, new TeamAppTreeItem({
            collapsibleState: this.children.size ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded,
            ...app,
          }));
        }
      }

      if (this.children.size) {
        this.clean(res.apps);
        this.refresh();
      } else {
        this.init();
      }
    } else {
      const app = this.children.get(appId) as TeamAppTreeItem;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      app?._patch(res.apps);
      this.refresh();
    }
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

  addRawApps(data: (ApiUploadApp | ApiVscodeApp | BaseApiApp)[]) {
    for (const app of data) {
      this.addRawApp(app);
    }
    this.clean(data);
    this.refresh();
  }

  addRawApp(data: ApiUploadApp | ApiVscodeApp | BaseApiApp) {
    const app = this.children.get(data.id) as TeamAppTreeItem;
    if (app) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      app._patch(data);
    } else {
      this.children.set(data.id, new TeamAppTreeItem({
        collapsibleState: this.children.size ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded,
        ...data,
      }));
    }
    this.refresh();
  }

  edit(appId: string, data: (ApiUploadApp | ApiVscodeApp)) {
    const app = this.children.get(appId) as TeamAppTreeItem;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    app?._patch(data);
  }

  async fetch() {
    await window.withProgress({
      location: { viewId: this.viewId },
      title: t("refreshing"),
    }, async () => {
      await this.getApps();
    });
  }

  init() {
    this.children.clear();
    this.children.set("x", new TeamAppTreeItem({
      label: "Nenhuma aplicação foi encontrada.",
      iconName: "x",
    }));
  }
}