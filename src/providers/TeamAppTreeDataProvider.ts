import { t } from "@vscode/l10n";
import { type ApiStatusApp, type ApiTeamApps, type BaseApiApp, type RESTGetApiAppStatusResult, type RESTGetApiTeamResult, Routes } from "discloud.app";
import { type ExtensionContext, type ProviderResult, type TreeItem, commands, window } from "vscode";
import extension from "../extension";
import EmptyAppListTreeItem from "../structures/EmptyAppListTreeItem";
import TeamAppTreeItem from "../structures/TeamAppTreeItem";
import { ConfigKeys, SortBy, TreeViewIds } from "../util/constants";
import { compareBooleans, compareNumbers } from "../util/utils";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

type Item = TeamAppTreeItem

export default class TeamAppTreeDataProvider extends BaseTreeDataProvider<Item> {
  constructor(context: ExtensionContext) {
    super(context, TreeViewIds.discloudTeamApps);
  }

  protected _sort(children: TeamAppTreeItem[]) {
    const sort = extension.config.get<string>(ConfigKeys.teamSortBy);

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
        children.sort((a, b) => `${a.data.name}`.localeCompare(`${b.data.name}`));
        break;

      case SortBy.nameDesc:
        children.sort((a, b) => `${b.data.name}`.localeCompare(`${a.data.name}`));
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
    if (sortOnlineFirst) children.sort((a, b) => compareBooleans(a.online!, b.online!));
  }

  getChildren(element?: Item): ProviderResult<Item[]>;
  getChildren(element?: TeamAppTreeItem): ProviderResult<TreeItem[]> {
    if (element) return element.children.values().toArray();

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
    commands.executeCommand("setContext", "discloudTeamAppLength", this.children.has("x") ? 0 : this.children.size);
    super.refresh(data);
  }

  setRawApps(data: BaseApiApp[]) {
    this.cleanNonMatchedApps(data);

    let refresh;

    for (const app of data) {
      if (this.addRawApp(app, true))
        refresh = true;
    }

    if (!this.children.size) this.init();

    if (refresh) this.refresh();
  }

  addRawApp(data: BaseApiApp): void
  addRawApp(data: BaseApiApp, returnBoolean: true): boolean
  addRawApp(data: BaseApiApp, returnBoolean?: boolean) {
    const existing = this.children.get(data.id);

    if (existing) {
      // @ts-expect-error ts(2445)
      const clone = existing._update(data);

      this.refresh(existing);

      extension.emit("teamAppUpdate", clone, existing);

      if (returnBoolean) return false;
    } else {
      const child = new TeamAppTreeItem(data);

      this.children.set(data.id, child);

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

      extension.emit("teamAppUpdate", clone, app);

      this.refresh(app);

      return true;
    }

    return false;
  }

  async getApps() {
    const response = await extension.api.get<RESTGetApiTeamResult>("/team");

    if (!response) return;

    if (!response.apps) {
      if ("statusCode" in response) {
        switch (response.statusCode) {
          case 403:
            this.init();
            break;
        }
      }

      return;
    }

    this.setRawApps(response.apps);
  }

  async getStatus(appId: string) {
    const response = await extension.api.queueGet<RESTGetApiAppStatusResult>(Routes.teamStatus(appId));

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
      await this.getApps();
    });
  }

  init() {
    this.children.dispose();

    this.children.set("x", new EmptyAppListTreeItem() as Item);

    this.refresh();
  }
}
