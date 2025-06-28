import { t } from "@vscode/l10n";
import { calculatePercentage, type ApiStatusApp } from "discloud.app";
import { TreeItemCollapsibleState, Uri } from "vscode";
import { AppType } from "../@enum";
import { type ApiVscodeApp, type AppChildTreeItemData, type AppTreeItemData } from "../@types";
import extension from "../extension";
import { ConfigKeys } from "../util/constants";
import { getIconName, getIconPath } from "../util/utils";
import AppChildTreeItem from "./AppChildTreeItem";
import BaseTreeItem from "./BaseTreeItem";

export default class AppTreeItem extends BaseTreeItem<AppChildTreeItem> {
  constructor(public readonly data: Partial<AppTreeItemData & ApiStatusApp> & ApiVscodeApp) {
    data.label ??= data.appId ?? data.id;

    super(data.label, data.collapsibleState);

    this.appId = data.appId ??= data.id;

    this.type = data.type;

    this._patch(data);
  }

  declare iconName: string;
  declare readonly appId: string;
  declare readonly type: AppType;

  get output() {
    return extension.getLogOutputChannel(this.appId);
  }

  dispose() {
    extension.logOutputChannels.delete(this.appId);

    this.output.dispose();

    super.dispose();
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

    if (data.avatarURL)
      this.data.avatarURL = data.avatarURL = data.avatarURL.replace(/\s+/g, "");

    if (data.name)
      this.label = this.type === AppType.bot ? `${data.name} (${this.appId})` : this.appId;

    this.iconName = getIconName(this.data) ?? "off";
    this.iconPath = getIconPath(this.iconName);

    this.contextValue = `${this.contextKey}.${JSON.stringify(this.contextJSON)}`;

    const showAvatar = extension.config.get<string>(ConfigKeys.appShowAvatarInsteadStatus);

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

    if (data.memory) {
      const matched = data.memory.match(/[\d.]+/g) ?? [];
      data.memoryUsage = calculatePercentage(matched[0]!, matched[1]);
    }

    if (data.startedAt)
      data.startedAtTimestamp = new Date(data.startedAt).valueOf();

    this._addChild("status", {
      label: this.online ? t("online") : t("offline"),
      description: "Status",
      iconName: "container",
    });

    if (data.memory)
      this._addChild("memory", {
        label: data.memory,
        description: t("label.ram"),
        iconName: "ram",
      });

    if (data.cpu)
      this._addChild("cpu", {
        label: data.cpu,
        description: t("label.cpu"),
        iconName: "cpu",
      });

    if (data.ssd)
      this._addChild("ssd", {
        label: data.ssd,
        description: t("label.ssd"),
        iconName: "ssd",
      });

    if (data.netIO)
      this._addChild("netIO", {
        label: `⬇${data.netIO.down} ⬆${data.netIO.up}`,
        description: t("network"),
        iconName: "network",
      });

    if (data.last_restart)
      this._addChild("last_restart", {
        label: data.last_restart,
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
