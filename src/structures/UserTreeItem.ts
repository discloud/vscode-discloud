import { t } from "@vscode/l10n";
import { TreeItemCollapsibleState } from "vscode";
import { UserTreeItemData } from "../@types";
import BaseTreeItem from "./BaseTreeItem";
import UserChildTreeItem from "./UserChildTreeItem";
import VSUser from "./VSUser";

export default class UserTreeItem extends BaseTreeItem<UserChildTreeItem> {
  iconName?: string;
  userID?: string;

  constructor(public data: Partial<UserTreeItemData & VSUser>) {
    data.label ??= "username" in data ?
      `${data.username} (${data.userID})` :
      `${data.userID}`;

    super(data.label, data.collapsibleState);

    this._patch(data);
  }

  protected _patch(data: Partial<UserTreeItemData & VSUser>): this {
    super._patch(data);

    this.userID ??= data.userID;

    this.label ??= "username" in data ?
      `${data.username} (${data.userID})` :
      `${data.userID}`;

    if (data.children instanceof Map)
      this.children = data.children;

    if (("ramUsedMb" in data) && ("totalRamMb" in data))
      this.children.set("ram", new UserChildTreeItem({
        label: `${data.ramUsedMb}/${data.totalRamMb}`,
        description: t("label.available.ram"),
      }));

    if ("plan" in data)
      this.children.set("plan", new UserChildTreeItem({
        label: data.plan,
        description: t("plan"),
      }));

    if ("locale" in data)
      this.children.set("locale", new UserChildTreeItem({
        label: data.locale,
        description: t("locale"),
      }));

    if ("apps" in data)
      this.children.set("apps", new UserChildTreeItem({
        label: `${data.apps?.length}`,
        description: t("label.apps.amount"),
      }));

    if ("appsTeam" in data)
      this.children.set("team", new UserChildTreeItem({
        label: `${data.appsTeam?.length}`,
        description: t("label.team.apps.amount"),
      }));

    if ("customdomains" in data)
      this.children.set("domains", new UserChildTreeItem({
        label: `${data.customdomains?.length}`,
        description: t("label.domains.amount"),
      }));

    if ("subdomains" in data)
      this.children.set("subdomains", new UserChildTreeItem({
        label: `${data.subdomains?.length}`,
        description: t("label.subdomains.amount"),
      }));

    this.collapsibleState =
      this.children.size ?
        this.data.collapsibleState ??
        TreeItemCollapsibleState.Expanded :
        TreeItemCollapsibleState.None;

    return this;
  }
}
