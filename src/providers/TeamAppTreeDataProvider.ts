import { t } from "@vscode/l10n";
import { ApiStatusApp, ApiTeamApps, BaseApiApp, RESTGetApiAppAllStatusResult, RESTGetApiAppStatusResult, RESTGetApiTeamResult, Routes } from "discloud.app";
import { ProviderResult, TreeItem, TreeItemCollapsibleState, commands, window } from "vscode";
import extension from "../extension";
import TeamAppTreeItem from "../structures/TeamAppTreeItem";
import { getIconPath, requester } from "../util";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class TeamAppTreeDataProvider extends BaseTreeDataProvider<TeamAppTreeItem> {
  constructor(viewId: string) {
    super(viewId);
  }

  getChildren(element?: TeamAppTreeItem): ProviderResult<TeamAppTreeItem[]>;
  getChildren(element?: NonNullable<TeamAppTreeItem>): ProviderResult<any[]> {
    if (element) return Array.from(element.children.values());

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

  refresh(data: void | TeamAppTreeItem | TeamAppTreeItem[] | null | undefined) {
    commands.executeCommand("setContext", "discloudTeamAppLength", this.children.has("x") ? 0 : this.children.size);
    super.refresh(data);
  }

  setRawApps(data: BaseApiApp[]) {
    this.cleanNonMatchedApps(data);

    let refresh;

    for (const app of data) {
      if (this.addRawApp(app))
        refresh = true;
    }

    if (!this.children.size) this.init();

    if (refresh) this.refresh();
  }

  addRawApp(data: BaseApiApp, returnBoolean?: boolean) {
    const existing = this.children.get(data.id);

    if (existing) {
      // @ts-expect-error ts(2445)
      const clone = existing._update(data);

      this.refresh(existing);

      extension.emit("teamAppUpdate", clone, existing);
    } else {
      this.children.set(data.id, new TeamAppTreeItem(Object.assign({
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

  editRawApp(appId: string, data: Partial<ApiTeamApps & ApiStatusApp>) {
    const app = this.children.get(appId);

    if (app) {
      // @ts-expect-error ts(2445)
      const clone = app._update(data);

      this.refresh(app);

      extension.emit("teamAppUpdate", clone, app);
    }
  }

  async getApps() {
    const res = await requester<RESTGetApiTeamResult>("/team");

    if (!res) return;

    if (!res.apps) {
      if ("statusCode" in res) {
        switch (res.statusCode) {
          case 403:
            this.init();
            break;
        }
      }

      return;
    }

    this.setRawApps(res.apps);
  }

  async getStatus(appId: string = "all") {
    const res = await requester<
      | RESTGetApiAppStatusResult
      | RESTGetApiAppAllStatusResult
    >(Routes.teamStatus(appId), {}, true);

    if (!res) return;

    if (!res.apps) {
      if ("statusCode" in res) {
        switch (res.statusCode) {
          case 404:
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
      await this.getApps();
    });
  }

  init() {
    this.children.clear();

    const x = new TreeItem(t("noappfound"));
    x.contextValue = "EmptyTreeItem";
    x.iconPath = getIconPath("x");

    this.children.set("x", <TeamAppTreeItem>x);

    this.refresh();
  }
}
