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
    data.label ??= data.username ?
      `${data.username} - ID ${data.userID}` :
      `${data.userID}`;

    super(data.label, data.collapsibleState ??= TreeItemCollapsibleState.Expanded);

    this._patch(data);
  }

  protected _patch(data: Partial<UserTreeItemData & VSUser>): this {
    super._patch(data);

    this.userID ??= data.userID;

    this.label ??= "userID" in data ?
      `${data.userID}` :
      `${data.label}`;

    if (data.children instanceof Map)
      this.children = data.children;

    if (("ramUsedMb" in data) && ("totalRamMb" in data))
      this.children.set("ram", new UserChildTreeItem({
        label: t("label.available.ram"),
        description: `${data.ramUsedMb}/${data.totalRamMb}`,
      }));

    if ("plan" in data)
      this.children.set("plan", new UserChildTreeItem({
        label: t("plan"),
        description: data.plan,
      }));

    if ("locale" in data)
      this.children.set("locale", new UserChildTreeItem({
        label: t("locale"),
        description: data.locale,
      }));

    if ("apps" in data)
      this.children.set("apps", new UserChildTreeItem({
        label: t("label.apps.amount"),
        description: `${data.apps?.length}`,
      }));

    if ("appsTeam" in data)
      this.children.set("team", new UserChildTreeItem({
        label: t("label.team.apps.amount"),
        description: `${data.appsTeam?.length}`,
      }));

    if ("customdomains" in data)
      this.children.set("domains", new UserChildTreeItem({
        label: t("label.domains.amount"),
        description: `${data.customdomains?.length}`,
      }));

    if ("subdomains" in data)
      this.children.set("subdomains", new UserChildTreeItem({
        label: t("label.subdomains.amount"),
        description: `${data.subdomains?.length}`,
      }));

    this.collapsibleState =
      this.children.size ?
        data.collapsibleState ?? TreeItemCollapsibleState.Expanded :
        TreeItemCollapsibleState.None;

    this.collapsibleState =
      this.children.size ?
        data.collapsibleState ?? TreeItemCollapsibleState.Collapsed :
        TreeItemCollapsibleState.None;

    return this;
  }
}
