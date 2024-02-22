import { t } from "@vscode/l10n";
import { /* ApiStatusApp, */ ApiStatusApp, ApiTeamApps, BaseApiApp, ModPermissionsBF, ModPermissionsResolvable } from "discloud.app";
import { LogOutputChannel, TreeItemCollapsibleState, window } from "vscode";
import { AppType } from "../@enum";
import { TeamAppChildTreeItemData, TeamAppTreeItemData } from "../@types";
import { calculatePercentage, getIconName, getIconPath } from "../util";
import BaseTreeItem from "./BaseTreeItem";
import TeamAppChildTreeItem from "./TeamAppChildTreeItem";

const totalModPerms = ModPermissionsBF.All.toArray().length;

export default class TeamAppTreeItem extends BaseTreeItem<TeamAppChildTreeItem> {
  declare iconName: string;
  declare readonly appId: string;
  declare type?: AppType;
  declare readonly output: LogOutputChannel;
  readonly permissions = new ModPermissionsBF();
  readonly contextKey = "TreeItem";

  constructor(public readonly data: Partial<TeamAppTreeItemData & ApiTeamApps> & BaseApiApp) {
    data.label ??= data.appId ?? data.id;

    super(data.label, data.collapsibleState);

    this.appId = data.appId ??= data.id;

    this.output = window.createOutputChannel(this.appId, { log: true });

    this._patch(data);
  }

  get contextJSON() {
    return {
      online: this.online,
      perms: this.permissions.toArray(),
    };
  }

  get online() {
    return this.data.online ?? null;
  }

  _patch(data: Partial<TeamAppTreeItemData & ApiTeamApps & ApiStatusApp>): this {
    if (!data) data = {};

    super._patch(data);

    if ("type" in data) this.type = data.type;

    if ("name" in data && typeof data.name === "string")
      this.label = this.type === AppType.bot ? `${data.name} (${this.appId})` : this.appId;

    this.iconName = getIconName(data) ?? data.iconName ?? this.iconName ?? "off";
    this.iconPath = getIconPath(this.iconName);

    this.tooltip = t(`app.status.${this.iconName}`) + " - " + this.label;

    if (data.children instanceof Map) {
      for (const [id, child] of data.children) {
        this.children.set(id, child);
      }
    }

    if ("memory" in data) {
      const matched = data.memory?.match(/[\d.]+/g) ?? [];
      this.data.memoryUsage = calculatePercentage(matched[0]!, matched[1]);
    }

    if ("startedAt" in data) {
      this.data.startedAtTimestamp = new Date(data.startedAt!).valueOf();
    }

    if (typeof this.online === "boolean")
      this._addChild("status", {
        label: this.online ? t("online") : t("offline"),
        description: "Status",
        iconName: "container",
        appId: this.appId,
      });

    if ("memory" in data)
      this._addChild("memory", {
        label: data.memory!,
        description: t("label.ram"),
        iconName: "ram",
        appId: this.appId,
      });

    if ("cpu" in data)
      this._addChild("cpu", {
        label: data.cpu!,
        description: t("label.cpu"),
        iconName: "cpu",
        appId: this.appId,
      });

    if ("ssd" in data)
      this._addChild("ssd", {
        label: data.ssd!,
        description: t("label.ssd"),
        iconName: "ssd",
        appId: this.appId,
      });

    if ("netIO" in data)
      this._addChild("netIO", {
        label: `⬇${data.netIO?.down} ⬆${data.netIO?.up}`,
        description: t("network"),
        iconName: "network",
        appId: this.appId,
      });

    if ("last_restart" in data)
      this._addChild("last_restart", {
        label: data.last_restart!,
        description: t("last.restart"),
        iconName: "uptime",
        appId: this.appId,
      });

    if (data.perms) {
      this.permissions.set(<ModPermissionsResolvable>data.perms);

      this._addChild("perms", {
        label: `${data.perms?.length} / ${totalModPerms}`,
        description: t("permissions"),
        children: data.perms?.map(perm => new TeamAppChildTreeItem({
          label: t(`permission.${perm}`),
          appId: this.appId,
        })),
        appId: this.appId,
        collapsibleState: TreeItemCollapsibleState.Collapsed,
      });
    }

    this.contextValue = `${this.contextKey}.${JSON.stringify(this.contextJSON)}`;

    this.collapsibleState =
      this.children.size ?
        this.data.collapsibleState ??
        TreeItemCollapsibleState.Collapsed :
        TreeItemCollapsibleState.None;

    return this;
  }

  private _addChild(id: string, data: TeamAppChildTreeItemData) {
    const existing = this.children.get(id);

    if (existing) {
      existing._patch(data);
      return;
    }

    this.children.set(id, new TeamAppChildTreeItem(data));
  }
}
