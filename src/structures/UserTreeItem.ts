import { t } from "@vscode/l10n";
import { TreeItemCollapsibleState } from "vscode";
import { UserTreeItemData } from "../@types";
import BaseTreeItem from "./BaseTreeItem";
import UserChildTreeItem from "./UserChildTreeItem";
import VSUser from "./VSUser";

export default class UserTreeItem extends BaseTreeItem<UserChildTreeItem> {
  iconName?: string;
  readonly userID: string;

  constructor(public data: Partial<UserTreeItemData & VSUser> & { userID: string }) {
    data.label = typeof data.username === "string" ?
      `${data.username} (${data.userID})` :
      `${data.userID}`;

    super(data.label, data.collapsibleState);

    this.userID = data.userID;

    this._patch(data);
  }

  protected _patch(data: Partial<UserTreeItemData & VSUser>): this {
    if (!data) data = {};

    super._patch(data);

    this.label = typeof data.username === "string" ?
      `${data.username} (${data.userID})` :
      `${data.userID}`;

    if (data.children instanceof Map) {
      for (const [id, child] of data.children) {
        this.children.set(id, child);
      }
    }

    if (("ramUsedMb" in data) && ("totalRamMb" in data))
      this.children.set("ram", new UserChildTreeItem({
        label: `${data.ramUsedMb}/${data.totalRamMb}`,
        description: t("label.available.ram"),
        userID: this.userID,
      }));

    if ("plan" in data)
      this.children.set("plan", new UserChildTreeItem({
        label: data.plan,
        description: t("plan"),
        userID: this.userID,
      }));

    if ("locale" in data)
      this.children.set("locale", new UserChildTreeItem({
        label: data.locale,
        description: t("locale"),
        userID: this.userID,
      }));

    if ("apps" in data)
      this.children.set("apps", new UserChildTreeItem({
        label: `${data.apps?.length}`,
        description: t("label.apps.amount"),
        userID: this.userID,
      }));

    if ("appsTeam" in data)
      this.children.set("team", new UserChildTreeItem({
        label: `${data.appsTeam?.length}`,
        description: t("label.team.apps.amount"),
        userID: this.userID,
      }));

    if ("customdomains" in data)
      this.children.set("domains", new UserChildTreeItem({
        label: `${data.customdomains?.length}`,
        description: t("label.domains.amount"),
        userID: this.userID,
      }));

    if ("subdomains" in data)
      this.children.set("subdomains", new UserChildTreeItem({
        label: `${data.subdomains?.length}`,
        description: t("label.subdomains.amount"),
        userID: this.userID,
      }));

    this.collapsibleState =
      this.children.size ?
        this.data.collapsibleState ??
        TreeItemCollapsibleState.Expanded :
        TreeItemCollapsibleState.None;

    return this;
  }
}
