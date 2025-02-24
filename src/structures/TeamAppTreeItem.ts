import { t } from "@vscode/l10n";
import { /* ApiStatusApp, */ type ApiStatusApp, type ApiTeamApps, type BaseApiApp, ModPermissionsBF, type ModPermissionsResolvable } from "discloud.app";
import { type LogOutputChannel, TreeItemCollapsibleState } from "vscode";
import { AppType } from "../@enum";
import { type TeamAppChildTreeItemData, type TeamAppTreeItemData } from "../@types";
import extension from "../extension";
import { calculatePercentage, getIconName, getIconPath } from "../util";
import BaseTreeItem from "./BaseTreeItem";
import TeamAppChildTreeItem from "./TeamAppChildTreeItem";

const totalModPerms = ModPermissionsBF.All.toArray().length;

export default class TeamAppTreeItem extends BaseTreeItem<TeamAppChildTreeItem> {
  declare iconName: string;
  declare readonly appId: string;
  declare readonly output: LogOutputChannel;
  readonly permissions = new ModPermissionsBF();

  constructor(readonly data: Partial<TeamAppTreeItemData & ApiTeamApps & ApiStatusApp> & BaseApiApp) {
    data.label ??= data.appId ?? data.id;

    super(data.label, data.collapsibleState);

    this.appId = data.appId ??= data.id;

    this.output = extension.getLogOutputChannel(this.appId);

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

  get type() {
    return this.data.type ?? null;
  }

  _patch(data: Partial<TeamAppTreeItemData & ApiTeamApps & ApiStatusApp>): this {
    if (!data) return this;

    super._patch(data);

    if (data.name !== undefined)
      this.label = this.type === AppType.bot ? `${data.name} (${this.appId})` : this.appId;

    this.iconName = getIconName(this.data) ?? "off";
    this.iconPath = getIconPath(this.iconName);

    this.tooltip = t(`app.status.${this.iconName}`) + " - " + this.label;

    if (data.memory !== undefined) {
      const matched = data.memory.match(/[\d.]+/g) ?? [];
      data.memoryUsage = calculatePercentage(matched[0]!, matched[1]);
    }

    if (data.startedAt !== undefined)
      data.startedAtTimestamp = new Date(data.startedAt).valueOf();

    if (typeof this.online === "boolean")
      this._addChild("status", {
        label: this.online ? t("online") : t("offline"),
        description: "Status",
        iconName: "container",
        appId: this.appId,
      });

    if (data.memory !== undefined)
      this._addChild("memory", {
        label: data.memory!,
        description: t("label.ram"),
        iconName: "ram",
        appId: this.appId,
      });

    if (data.cpu !== undefined)
      this._addChild("cpu", {
        label: data.cpu!,
        description: t("label.cpu"),
        iconName: "cpu",
        appId: this.appId,
      });

    if (data.ssd !== undefined)
      this._addChild("ssd", {
        label: data.ssd!,
        description: t("label.ssd"),
        iconName: "ssd",
        appId: this.appId,
      });

    if (data.netIO !== undefined)
      this._addChild("netIO", {
        label: `⬇${data.netIO.down} ⬆${data.netIO.up}`,
        description: t("network"),
        iconName: "network",
        appId: this.appId,
      });

    if (data.last_restart !== undefined)
      this._addChild("last_restart", {
        label: data.last_restart!,
        description: t("last.restart"),
        iconName: "uptime",
        appId: this.appId,
      });

    if (data.perms) {
      this.permissions.set(<ModPermissionsResolvable>data.perms);

      this._addChild("perms", {
        label: `${data.perms.length} / ${totalModPerms}`,
        description: t("permissions"),
        appId: this.appId,
        collapsibleState: TreeItemCollapsibleState.Collapsed,
        children: data.perms.map(perm => new TeamAppChildTreeItem({
          label: t(`permission.${perm}`),
          appId: this.appId,
          appType: this.type,
          online: this.online,
        })),
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

  private _addChild(id: string, data: Partial<TeamAppChildTreeItemData>) {
    data.appId = this.appId;
    data.online = this.online;
    data.appType = this.type;

    const existing = this.children.get(id);

    if (existing) {
      existing._patch(data);
      return;
    }

    this.children.set(id, new TeamAppChildTreeItem(<TeamAppChildTreeItemData>data));
  }
}
