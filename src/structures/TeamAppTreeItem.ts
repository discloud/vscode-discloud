import { t } from "@vscode/l10n";
import { ApiAppStatus, ApiTeamApps } from "discloud.app";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { TeamAppTreeItemData } from "../@types";
import { getIconName, getIconPath } from "../util";
import BaseTreeItem from "./BaseTreeItem";
import TeamAppChildTreeItem from "./TeamAppChildTreeItem";

export default class TeamAppTreeItem extends BaseTreeItem<TeamAppChildTreeItem> {
  iconName?: string;
  appId?: string;
  appType?: string;

  constructor(public data: Partial<TeamAppTreeItemData & ApiTeamApps & ApiAppStatus>) {
    data.label ??= "name" in data ?
      `${data.name}${data.name?.includes(`${data.id}`) ? "" :
        ` - ID ${data.id}`}` :
      `${data.id}`;

    super(data.label, data.collapsibleState);

    this._patch(data);
  }

  protected _patch(data: Partial<TeamAppTreeItemData & ApiTeamApps & ApiAppStatus>): this {
    this.appId ??= data.appId ?? data.id;

    data.label ??= "name" in data ?
      `${data.name}${data.name?.includes(`${data.id}`) ? "" :
        ` - ID ${data.id}`}` :
      `${data.id}`;

    this.appType = data.appType ?? "name" in data ? (data.name?.includes(`${data.id}`) ? "site" : "bot") : this.appType;

    this.iconName = getIconName(data) ?? data.iconName ?? this.iconName ?? "off";
    this.iconPath = getIconPath(this.iconName);

    if (data.children instanceof Map)
      this.children = data.children;

    if ("container" in data)
      this.children.set("container", new TeamAppChildTreeItem({
        label: t("container"),
        description: data.container,
        iconName: "container",
        appId: this.appId,
      }));

    if ("memory" in data)
      this.children.set("memory", new TeamAppChildTreeItem({
        label: t("label.ram"),
        description: data.memory,
        iconName: "ram",
        appId: this.appId,
      }));

    if ("cpu" in data)
      this.children.set("cpu", new TeamAppChildTreeItem({
        label: t("label.cpu"),
        description: data.cpu,
        iconName: "cpu",
        appId: this.appId,
      }));

    if ("ssd" in data)
      this.children.set("ssd", new TeamAppChildTreeItem({
        label: t("label.ssd"),
        description: data.ssd,
        iconName: "ssd",
        appId: this.appId,
      }));

    if ("netIO" in data)
      this.children.set("netIO", new TeamAppChildTreeItem({
        label: t("network"),
        description: `⬆${data.netIO?.up} ⬇${data.netIO?.down}`,
        iconName: "network",
        appId: this.appId,
      }));

    if ("last_restart" in data)
      this.children.set("last_restart", new TeamAppChildTreeItem({
        label: t("last.restart"),
        description: data.last_restart,
        iconName: "uptime",
        appId: this.appId,
      }));

    if ("perms" in data)
      this.children.set("perms", new TeamAppChildTreeItem({
        label: t("permissions"),
        children: data.perms?.map(perm => new TreeItem(t(`permission.${perm}`))) ?? [],
        appId: this.appId,
        collapsibleState: TreeItemCollapsibleState.Collapsed,
      }));

    return super._patch(data);
  }
}