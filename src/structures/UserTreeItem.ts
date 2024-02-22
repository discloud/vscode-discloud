import { t } from "@vscode/l10n";
import { TreeItemCollapsibleState } from "vscode";
import { ApiVscodeUser, UserTreeItemData } from "../@types";
import BaseTreeItem from "./BaseTreeItem";
import UserChildTreeItem from "./UserChildTreeItem";

export default class UserTreeItem extends BaseTreeItem<UserChildTreeItem> {
  iconName?: string;
  readonly userID: string;

  constructor(public data: Partial<UserTreeItemData> & ApiVscodeUser) {
    data.label = typeof data.username === "string" ?
      data.username + ` (${data.userID})` :
      data.userID;

    super(data.label, data.collapsibleState);

    this.userID = data.userID;

    this._patch(data);
  }

  protected _patch(data: Partial<UserTreeItemData & ApiVscodeUser>): this {
    if (!data) data = {};

    super._patch(data);

    this.label = typeof data.username === "string" ?
      data.username + ` (${data.userID})` :
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

    if ("planDataEnd" in data && typeof data.planDataEnd === "string")
      this.children.set("planDataEnd", new UserChildTreeItem({
        label: ["Subscription"].includes(data.planDataEnd) ?
          data.planDataEnd :
          new Date(data.planDataEnd).toLocaleDateString(),
        description: t("label.plan.expiration"),
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
        label: `${data.apps?.length ?? 0}`,
        description: t("label.apps.amount"),
        userID: this.userID,
      }));

    if ("appsTeam" in data)
      this.children.set("team", new UserChildTreeItem({
        label: `${data.appsTeam?.length ?? 0}`,
        description: t("label.team.apps.amount"),
        userID: this.userID,
      }));

    if ("customdomains" in data)
      this.children.set("domains", new UserChildTreeItem({
        label: `${data.customdomains?.length ?? 0}`,
        description: t("label.domains.amount"),
        userID: this.userID,
      }));

    if ("subdomains" in data)
      this.children.set("subdomains", new UserChildTreeItem({
        label: `${data.subdomains?.length ?? 0}`,
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
