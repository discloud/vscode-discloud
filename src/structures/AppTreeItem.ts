import { t } from "@vscode/l10n";
import { TreeItemCollapsibleState } from "vscode";
import { ApiVscodeApp, AppTreeItemData } from "../@types";
import { getIconName, getIconPath } from "../util";
import AppChildTreeItem from "./AppChildTreeItem";
import BaseTreeItem from "./BaseTreeItem";

export default class AppTreeItem extends BaseTreeItem<AppChildTreeItem> {
  iconName?: string;
  appId?: string;
  appType?: string;

  constructor(public data: Partial<AppTreeItemData & ApiVscodeApp>) {
    data.label ??= "name" in data ?
      `${data.name}${data.name?.includes(`${data.id}`) ? "" :
        ` - ID ${data.id}`}` :
      `${data.id}`;

    super(data.label, data.collapsibleState);

    this._patch(data);
  }

  protected _patch(data: Partial<AppTreeItemData & ApiVscodeApp>): this {
    super._patch(data);

    this.appId ??= data.appId ?? data.id;

    this.label ??= "name" in data ?
      `${data.name}${data.name?.includes(`${this.appId}`) ? "" :
        ` - ID ${data.id}`}` :
      `${data.id}`;

    this.appType = data.appType ?? "name" in data ? (data.name?.includes(`${data.id}`) ? "site" : "bot") : this.appType;

    this.iconName = getIconName(data) ?? data.iconName ?? this.iconName ?? "off";
    this.iconPath = getIconPath(this.iconName);

    if (data.children instanceof Map)
      this.children = data.children;

    if ("container" in data)
      this.children.set("container", new AppChildTreeItem({
        label: t("container"),
        description: data.container,
        iconName: "container",
        appId: this.appId,
      }));

    if ("memory" in data)
      this.children.set("memory", new AppChildTreeItem({
        label: t("label.ram"),
        description: data.memory,
        iconName: "ram",
        appId: this.appId,
      }));

    if ("cpu" in data)
      this.children.set("cpu", new AppChildTreeItem({
        label: t("label.cpu"),
        description: data.cpu,
        iconName: "cpu",
        appId: this.appId,
      }));

    if ("ssd" in data)
      this.children.set("ssd", new AppChildTreeItem({
        label: t("label.ssd"),
        description: data.ssd,
        iconName: "ssd",
        appId: this.appId,
      }));

    if ("netIO" in data)
      this.children.set("netIO", new AppChildTreeItem({
        label: t("network"),
        description: `⬇${data.netIO?.down} ⬆${data.netIO?.up}`,
        iconName: "network",
        appId: this.appId,
      }));

    if ("last_restart" in data)
      this.children.set("last_restart", new AppChildTreeItem({
        label: t("last.restart"),
        description: data.last_restart,
        iconName: "uptime",
        appId: this.appId,
      }));

    this.collapsibleState =
      this.children.size ?
        data.collapsibleState ?? TreeItemCollapsibleState.Collapsed :
        TreeItemCollapsibleState.None;

    return this;
  }
}
