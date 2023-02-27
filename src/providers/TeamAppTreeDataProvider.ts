import { t } from "@vscode/l10n";
import { ApiUploadApp, BaseApiApp, RESTGetApiAppAllStatusResult, RESTGetApiAppStatusResult, RESTGetApiTeamResult, Routes } from "discloud.app";
import { TreeItemCollapsibleState, window } from "vscode";
import { ApiVscodeApp } from "../@types";
import TeamAppTreeItem from "../structures/TeamAppTreeItem";
import { requester } from "../util";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class TeamAppTreeDataProvider extends BaseTreeDataProvider<TeamAppTreeItem> {
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

  async getApps() {
    const res = await requester<RESTGetApiTeamResult>("/team", {}, true);

    if (!res.apps) {
      if ("statusCode" in res) {
        switch (res.statusCode) {
          case 404:
            this.children.clear();
            this.init();
            break;
        }
      }

      return;
    }

    this.setRawApps(res.apps);

    if (this.children.size) {
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

    if (Array.isArray(res.apps)) {
      this.setRawApps(res.apps);
    } else {
      if (this.addRawApp(res.apps))
        this.refresh();
    }
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
      if (this.addRawApp(app))
        refresh = true;
    }

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
      this.children.set(data.id, new TeamAppTreeItem({
        collapsibleState: this.children.size ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded,
        ...data,
      }));

      if (returnBoolean) {
        return true;
      } else {
        this.refresh();
      }
    }
  }

  edit(appId: string, data: ApiUploadApp | ApiVscodeApp) {
    const app = this.children.get(appId);

    if (app) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.refresh(app._patch(data));
    }
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
      label: t("notappfound"),
      iconName: "x",
    }));

    this.refresh();
  }
}