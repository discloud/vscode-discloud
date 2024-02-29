import { t } from "@vscode/l10n";
import { ApiStatusApp } from "discloud.app";
import { LogOutputChannel, TreeItemCollapsibleState, Uri, window } from "vscode";
import { AppType } from "../@enum";
import { ApiVscodeApp, AppChildTreeItemData, AppTreeItemData } from "../@types";
import extension from "../extension";
import { calculatePercentage, getIconName, getIconPath } from "../util";
import AppChildTreeItem from "./AppChildTreeItem";
import BaseTreeItem from "./BaseTreeItem";

export default class AppTreeItem extends BaseTreeItem<AppChildTreeItem> {
  declare iconName: string;
  declare readonly appId: string;
  declare readonly type: AppType;
  declare readonly output: LogOutputChannel;
  readonly contextKey = "TreeItem";

  constructor(public readonly data: Partial<AppTreeItemData & ApiStatusApp> & ApiVscodeApp) {
    data.label ??= data.appId ?? data.id;

    super(data.label, data.collapsibleState);

    this.appId = data.appId ??= data.id;

    this.type = data.type;

    this.output = window.createOutputChannel(this.appId, { log: true });

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
  };

  dispose() {
    this.output.dispose();

    super.dispose();
  }

  _patch(data: Partial<AppTreeItemData & ApiVscodeApp & ApiStatusApp>): this {
    if (!data) data = {};

    super._patch(data);

    if ("avatarURL" in data)
      this.data.avatarURL = this.data.avatarURL.replace(/\s+/g, "");

    if ("name" in data)
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

    if ("memory" in data)
      this._addChild("memory", {
        label: this.data.memory,
        description: t("label.ram"),
        iconName: "ram",
      });

    if ("cpu" in data)
      this._addChild("cpu", {
        label: this.data.cpu,
        description: t("label.cpu"),
        iconName: "cpu",
      });

    if ("ssd" in data)
      this._addChild("ssd", {
        label: this.data.ssd,
        description: t("label.ssd"),
        iconName: "ssd",
      });

    if ("netIO" in data)
      this._addChild("netIO", {
        label: `⬇${this.data.netIO!.down} ⬆${this.data.netIO!.up}`,
        description: t("network"),
        iconName: "network",
      });

    if ("last_restart" in data)
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
