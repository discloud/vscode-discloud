import { t } from "@vscode/l10n";
import { TreeItemCollapsibleState } from "vscode";
import { type SubDomainTreeItemData } from "../@types";
import core from "../extension";
import { getIconName, getIconPath } from "../utils/utils";
import BaseTreeItem from "./BaseTreeItem";

export default class SubDomainTreeItem extends BaseTreeItem<any> {
  declare subdomain: string;
  declare iconName: string;

  constructor(public data: SubDomainTreeItemData) {
    data.label ??= data.subdomain;

    super(data.label, data.collapsibleState);

    this._patch(data);
  }

  protected _patch(data: Partial<SubDomainTreeItemData>): this {
    if (!data) return this;

    super._patch(data);

    this.subdomain = data.subdomain ?? this.subdomain;
    this.label = data.subdomain ?? this.label;

    const app = core.userAppTree.children.get(this.subdomain);

    this.iconName = app?.iconName ?? getIconName(data) ?? this.iconName ?? "off";
    this.iconPath = getIconPath(this.iconName);

    this.tooltip = t(`app.status.${this.iconName}`) + " - " + this.label;

    this.collapsibleState =
      this.children.size ?
        this.data.collapsibleState ??
        TreeItemCollapsibleState.Collapsed :
        TreeItemCollapsibleState.None;

    return this;
  }
}
