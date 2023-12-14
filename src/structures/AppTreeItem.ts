import { t } from "@vscode/l10n";
import { LogOutputChannel, TreeItemCollapsibleState, Uri, window } from "vscode";
import { ApiVscodeApp, AppTreeItemData } from "../@types";
import extension from "../extension";
import { calculatePercentage, getIconName, getIconPath } from "../util";
import AppChildTreeItem from "./AppChildTreeItem";
import BaseTreeItem from "./BaseTreeItem";

export default class AppTreeItem extends BaseTreeItem<AppChildTreeItem> {
  declare iconName?: string;
  declare readonly appId: string;
  declare appType?: string;
  declare readonly output: LogOutputChannel;
  declare isOnline: boolean;

  constructor(public readonly data: Partial<AppTreeItemData & ApiVscodeApp> & { id: string }) {
    data.label ??= typeof data.name === "string" ?
      `${data.name}`
      + (data.name?.includes(`${data.id}`) ? "" : ` (${data.id})`) :
      `${data.id}`;

    super(data.label, data.collapsibleState);

    this.appId = data.appId ??= data.id;

    this.output = window.createOutputChannel(this.appId, { log: true });

    this._patch(data);
  }

  protected _patch(data: Partial<AppTreeItemData & ApiVscodeApp>): this {
    if (!data) data = {};

    super._patch(data);

    if (data.avatarURL)
      this.data.avatarURL = data.avatarURL = data.avatarURL.replace(/\s+/g, "");

    this.label = data.label ??= "name" in data || "name" in this.data ?
      `${data.name ?? this.data.name}`
      + (data.name?.includes(`${data.id}`) ? "" : ` (${data.id})`) :
      `${data.id}`;

    this.appType = data.appType ??= "name" in data ?
      (data.name?.includes(`${data.id}`) ? "site" : "bot") :
      this.appType;

    this.iconName = getIconName(data) ?? data.iconName ?? this.iconName ?? "off";
    this.iconPath = getIconPath(this.iconName);
    this.isOnline = this.iconName === "on";

    const showAvatar = extension.config.get<string>("app.show.avatar.instead.status");

    switch (showAvatar) {
      case "always": {
        if (data.avatarURL ?? this.data.avatarURL)
          this.iconPath = Uri.parse(data.avatarURL ?? this.data.avatarURL!);

        break;
      }

      case "when.online": {
        if (this.iconName === "on" && (data.avatarURL ?? this.data.avatarURL))
          this.iconPath = Uri.parse(data.avatarURL ?? this.data.avatarURL!);

        break;
      }
    }

    this.tooltip = t(`app.status.${this.iconName}`) + " - " + this.label;

    if ("memory" in data) {
      const matched = data.memory?.match(/[\d.]+/g) ?? [];
      this.data.memoryUsage = calculatePercentage(matched[0]!, matched[1]);
    }

    if ("startedAt" in data) {
      this.data.startedAtTimestamp = new Date(data.startedAt!).valueOf();
    }

    if (data.children instanceof Map) {
      for (const [id, child] of data.children) {
        this.children.set(id, child);
      }
    }

    if ("container" in data)
      this.children.set("container", new AppChildTreeItem({
        label: data.container!,
        description: t("container"),
        iconName: "container",
        appId: this.appId,
      }));

    if ("memory" in data)
      this.children.set("memory", new AppChildTreeItem({
        label: data.memory!,
        description: t("label.ram"),
        iconName: "ram",
        appId: this.appId,
      }));

    if ("cpu" in data)
      this.children.set("cpu", new AppChildTreeItem({
        label: data.cpu!,
        description: t("label.cpu"),
        iconName: "cpu",
        appId: this.appId,
      }));

    if ("ssd" in data)
      this.children.set("ssd", new AppChildTreeItem({
        label: data.ssd!,
        description: t("label.ssd"),
        iconName: "ssd",
        appId: this.appId,
      }));

    if ("netIO" in data)
      this.children.set("netIO", new AppChildTreeItem({
        label: `⬇${data.netIO?.down} ⬆${data.netIO?.up}`,
        description: t("network"),
        iconName: "network",
        appId: this.appId,
      }));

    if ("last_restart" in data)
      this.children.set("last_restart", new AppChildTreeItem({
        label: data.last_restart!,
        description: t("last.restart"),
        iconName: "uptime",
        appId: this.appId,
      }));

    this.collapsibleState =
      this.children.size ?
        this.data.collapsibleState ??
        TreeItemCollapsibleState.Collapsed :
        TreeItemCollapsibleState.None;

    return this;
  }
}
