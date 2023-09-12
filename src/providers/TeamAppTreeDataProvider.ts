import { t } from "@vscode/l10n";
import { BaseApiApp, RESTGetApiAppAllStatusResult, RESTGetApiAppStatusResult, RESTGetApiTeamResult, Routes } from "discloud.app";
import { ProviderResult, TreeItemCollapsibleState, commands, window } from "vscode";
import extension from "../extension";
import TeamAppTreeItem from "../structures/TeamAppTreeItem";
import { requester } from "../util";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class TeamAppTreeDataProvider extends BaseTreeDataProvider<TeamAppTreeItem> {
  constructor(viewId: string) {
    super(viewId);
  }

  getChildren(element?: NonNullable<TeamAppTreeItem>): ProviderResult<any[]> {
    if (element) {
      return Array.from(element.children.values());
    }

    const children = Array.from(this.children.values());

    const sort = extension.config.get<string>("team.sort.by");

    if (sort?.includes(".")) {
      switch (sort) {
        case "id.asc":
          children.sort((a, b) => `${a.appId}` < `${b.appId}` ? -1 : 1);
          break;

        case "id.desc":
          children.sort((a, b) => `${a.appId}` > `${b.appId}` ? -1 : 1);
          break;

        case "memory.usage.asc":
          children.sort((a, b) => Number(a.data.memoryUsage) < Number(b.data.memoryUsage) ? -1 : 1);
          break;

        case "memory.usage.desc":
          children.sort((a, b) => Number(a.data.memoryUsage) > Number(b.data.memoryUsage) ? -1 : 1);
          break;

        case "name.asc":
          children.sort((a, b) => `${a.data.name}` < `${b.data.name}` ? -1 : 1);
          break;

        case "name.desc":
          children.sort((a, b) => `${a.data.name}` > `${b.data.name}` ? -1 : 1);
          break;

        case "started.asc":
          children.sort((a, b) => a.iconName === "on" &&
            Number(a.data.startedAtTimestamp) < Number(b.data.startedAtTimestamp) ? -1 : 1);
          break;

        case "started.desc":
          children.sort((a, b) => a.iconName === "on" &&
            Number(a.data.startedAtTimestamp) > Number(b.data.startedAtTimestamp) ? -1 : 1);
          break;
      }
    }

    if (
      extension.config.get<boolean>("team.sort.online") ||
      (sort && ["started.asc", "started.desc"].includes(sort))
    ) {
      children.sort((a, b) => a.iconName === "on" ? b.iconName === "on" ? 0 : -1 : 0);
    }

    return children;
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

    if (res && !res.apps) {
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
        await this.getStatus("all", true);
      });
    } else {
      this.init();
    }
  }

  async getStatus(appId: string = "all", noClear?: boolean) {
    const res = await requester<
      | RESTGetApiAppStatusResult
      | RESTGetApiAppAllStatusResult
    >(Routes.teamStatus(appId), {}, true);

    if (res && !res.apps) {
      if ("statusCode" in res) {
        switch (res.statusCode) {
          case 404:
            if (noClear) break;
            if (appId === "all") {
              this.children.clear();
            } else {
              this.delete(appId);
            }
            break;
        }
      }

      return;
    }

    if (Array.isArray(res.apps)) {
      this.setRawApps(res.apps);
    } else {
      this.edit(appId, res.apps);
    }
  }

  delete(id: string) {
    if (this.children.delete(id)) {
      if (!this.children.size)
        this.init();

      this.refresh();
    }
  }

  refresh(data: void | TeamAppTreeItem | TeamAppTreeItem[] | null | undefined) {
    commands.executeCommand("setContext", "discloudTeamAppLength", this.children.has("x") ? 0 : this.children.size);
    super.refresh(data);
  }

  setRawApps(data: BaseApiApp[]) {
    this.clean(data);

    let refresh;

    for (const app of data) {
      if (this.addRawApp(app))
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
      const oldApp = app._clone();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.refresh(app._patch(data));

      extension.emit("teamAppUpdate", oldApp, app);
    } else {
      this.children.set(data.id, new TeamAppTreeItem({
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
      const oldApp = app._clone();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.refresh(app._patch(data));

      extension.emit("teamAppUpdate", oldApp, app);
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
      label: t("noappfound"),
      iconName: "x",
    }));

    this.refresh();
  }
}
