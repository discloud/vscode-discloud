import { t } from "@vscode/l10n";
import { TreeItemCollapsibleState } from "vscode";
import { UserTreeItemData } from "../@types";
import BaseTreeItem from "./BaseTreeItem";
import UserChildTreeItem from "./UserChildTreeItem";
import VSUser from "./VSUser";

export default class UserTreeItem extends BaseTreeItem<UserChildTreeItem> {
  iconName?: string;
  userID?: string;

  constructor(data: Partial<UserTreeItemData & VSUser>) {
    data.label ??= "userID" in data ?
      `${data.userID}` :
      `${data.label}`;

    super(data.label, data.collapsibleState ??= TreeItemCollapsibleState.Expanded);

    this._patch(data);
  }

  protected _patch(data: Partial<UserTreeItemData & VSUser>): this {
    this.userID ??= data.userID;

    this.label ??= "userID" in data ?
      `${data.userID}` :
      `${data.label}`;

    if (data.children instanceof Map)
      this.children = data.children;

    if (("ramUsedMb" in data) && ("totalRamMb" in data))
      this.children.set("ram", new UserChildTreeItem({
        label: t("available.ram"),
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
        label: t("apps.amount"),
        description: `${data.apps?.length}`,
      }));

    if ("appsTeam" in data)
      this.children.set("team", new UserChildTreeItem({
        label: t("team.apps.amount"),
        description: `${data.appsTeam?.length}`,
      }));

    if ("customdomains" in data)
      this.children.set("domains", new UserChildTreeItem({
        label: t("domains.amount"),
        description: `${data.customdomains?.length}`,
      }));

    if ("subdomains" in data)
      this.children.set("subdomains", new UserChildTreeItem({
        label: t("subdomains.amount"),
        description: `${data.subdomains?.length}`,
      }));

    return super._patch(data);
  }
}
