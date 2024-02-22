import { t } from "@vscode/l10n";
import { TreeItemCollapsibleState } from "vscode";
import { ApiVscodeUser, UserTreeItemData } from "../@types";
import BaseTreeItem from "./BaseTreeItem";
import UserChildTreeItem from "./UserChildTreeItem";

export default class UserTreeItem extends BaseTreeItem<UserChildTreeItem> {
  iconName?: string;
  readonly userID: string;

  constructor(public data: Partial<UserTreeItemData> & ApiVscodeUser) {
    data.label = data.userID;

    super(data.label, data.collapsibleState);

    this.userID = data.userID;

    this._patch(data);
  }

  protected _patch(data: Partial<UserTreeItemData & ApiVscodeUser>): this {
    if (!data) data = {};

    super._patch(data);

    if ("username" in data && typeof data.userName === "string")
      this.label = data.userName + ` (${this.userID})`;

    if (data.children instanceof Map) {
      for (const [id, child] of data.children) {
        this.children.set(id, child);
      }
    }

    if (("ramUsedMb" in data) && ("totalRamMb" in data))
      this._addChild("ram", {
        label: `${data.ramUsedMb}/${data.totalRamMb}`,
        description: t("label.available.ram"),
        userID: this.userID,
      });

    if ("plan" in data)
      this._addChild("plan", {
        label: data.plan!,
        description: t("plan"),
        userID: this.userID,
      });

    if ("planDataEnd" in data && typeof data.planDataEnd === "string")
      this._addChild("planDataEnd", {
        label: ["Subscription"].includes(data.planDataEnd) ?
          data.planDataEnd :
          new Date(data.planDataEnd).toLocaleDateString(),
        description: t("label.plan.expiration"),
        userID: this.userID,
      });

    if ("locale" in data)
      this._addChild("locale", {
        label: data.locale!,
        description: t("locale"),
        userID: this.userID,
      });

    if ("apps" in data)
      this._addChild("apps", {
        label: `${data.apps?.length ?? 0}`,
        description: t("label.apps.amount"),
        userID: this.userID,
      });

    if ("appsTeam" in data)
      this._addChild("team", {
        label: `${data.appsTeam?.length ?? 0}`,
        description: t("label.team.apps.amount"),
        userID: this.userID,
      });

    if ("customdomains" in data)
      this._addChild("domains", {
        label: `${data.customdomains?.length ?? 0}`,
        description: t("label.domains.amount"),
        userID: this.userID,
      });

    if ("subdomains" in data)
      this._addChild("subdomains", {
        label: `${data.subdomains?.length ?? 0}`,
        description: t("label.subdomains.amount"),
        userID: this.userID,
      });

    this.collapsibleState =
      this.children.size ?
        this.data.collapsibleState ??
        TreeItemCollapsibleState.Expanded :
        TreeItemCollapsibleState.None;

    return this;
  }

  private _addChild(id: string, data: UserTreeItemData) {
    const existing = this.children.get(id);

    if (existing) {
      existing._patch(data);
      return;
    }

    this.children.set(id, new UserChildTreeItem(data));
  }
}
