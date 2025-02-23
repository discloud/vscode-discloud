import { t } from "@vscode/l10n";
import { type ApiStatusApp } from "discloud.app";
import { type LogOutputChannel, TreeItemCollapsibleState, Uri } from "vscode";
import { AppType } from "../@enum";
import { type ApiVscodeApp, type AppChildTreeItemData, type AppTreeItemData } from "../@types";
import extension from "../extension";
import { calculatePercentage, getIconName, getIconPath } from "../util";
import AppChildTreeItem from "./AppChildTreeItem";
import BaseTreeItem from "./BaseTreeItem";

export default class AppTreeItem extends BaseTreeItem<AppChildTreeItem> {
  declare iconName: string;
  declare readonly appId: string;
  declare readonly type: AppType;
  declare readonly output: LogOutputChannel;

  constructor(public readonly data: Partial<AppTreeItemData & ApiStatusApp> & ApiVscodeApp) {
    data.label ??= data.appId ?? data.id;

    super(data.label, data.collapsibleState);

    this.appId = data.appId ??= data.id;

    this.type = data.type;

    this.output = extension.getLogOutputChannel(this.appId);

    this._patch(data);
  }

  get contextJSON() {
    return {
      online: this.online,
      type: this.type,
    };
  }

  get online(): boolean {
    return this.data.online;
  }

  _patch(data: Partial<AppTreeItemData & ApiVscodeApp & ApiStatusApp>): this {
    if (!data) return this;

    super._patch(data);

    if (data.avatarURL !== undefined)
      this.data.avatarURL = this.data.avatarURL.replace(/\s+/g, "");

    if (data.name !== undefined)
      this.label = this.type === AppType.bot ? `${this.data.name} (${this.appId})` : this.appId;

    this.iconName = getIconName(this.data) ?? "off";
    this.iconPath = getIconPath(this.iconName);

    this.contextValue = `${this.contextKey}.${JSON.stringify(this.contextJSON)}`;

    const showAvatar = extension.config.get<string>("app.show.avatar.instead.status");

    switch (showAvatar) {
      case "always": {
        if (this.data.avatarURL)
          this.iconPath = Uri.parse(this.data.avatarURL);

        break;
      }

      case "when.online": {
        if (this.online && this.data.avatarURL)
          this.iconPath = Uri.parse(this.data.avatarURL);

        break;
      }
    }

    this.tooltip = t(`app.status.${this.iconName}`) + " - " + this.label;

    if (typeof data.memory === "string") {
      const matched = this.data.memory!.match(/[\d.]+/g) ?? [];
      this.data.memoryUsage = calculatePercentage(matched[0]!, matched[1]);
    }

    if (typeof data.startedAt === "string") {
      this.data.startedAtTimestamp = new Date(this.data.startedAt!).valueOf();
    }

    this._addChild("status", {
      label: this.online ? t("online") : t("offline"),
      description: "Status",
      iconName: "container",
    });

    if (data.memory !== undefined)
      this._addChild("memory", {
        label: this.data.memory,
        description: t("label.ram"),
        iconName: "ram",
      });

    if (data.cpu !== undefined)
      this._addChild("cpu", {
        label: this.data.cpu,
        description: t("label.cpu"),
        iconName: "cpu",
      });

    if (data.ssd !== undefined)
      this._addChild("ssd", {
        label: this.data.ssd,
        description: t("label.ssd"),
        iconName: "ssd",
      });

    if (data.netIO !== undefined)
      this._addChild("netIO", {
        label: `⬇${this.data.netIO!.down} ⬆${this.data.netIO!.up}`,
        description: t("network"),
        iconName: "network",
      });

    if (data.last_restart !== undefined)
      this._addChild("last_restart", {
        label: this.data.last_restart,
        description: t("last.restart"),
        iconName: "uptime",
      });

    this.collapsibleState =
      this.children.size ?
        this.data.collapsibleState ??
        TreeItemCollapsibleState.Collapsed :
        TreeItemCollapsibleState.None;

    return this;
  }

  private _addChild(id: string, data: Partial<AppChildTreeItemData>) {
    data.appId = this.appId;
    data.online = this.online;
    data.appType = this.type;

    const existing = this.children.get(id);

    if (existing) {
      existing._patch(data);
      return;
    }

    this.children.set(id, new AppChildTreeItem(<AppChildTreeItemData>data));
  }
}
