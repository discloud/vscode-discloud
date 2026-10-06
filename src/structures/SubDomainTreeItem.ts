import { t } from "@vscode/l10n";
import { type ExtensionContext, TreeItemCollapsibleState } from "vscode";
import type { SubDomainTreeItemData } from "../@types";
import core from "../extension";
import { getIconName } from "../utils/utils";
import { getIconPath } from "../utils/vscode";
import BaseTreeItem from "./BaseTreeItem";

export default class SubDomainTreeItem extends BaseTreeItem<any> {
  declare subdomain: string;
  declare iconName: string;

  constructor(context: ExtensionContext, public data: SubDomainTreeItemData) {
    data.label ??= data.subdomain;

    super(context, data.label, data.collapsibleState);

    this._patch(data);
  }

  protected _patch(data: Partial<SubDomainTreeItemData>): this {
    if (!data) return this;

    super._patch(data);

    this.subdomain = data.subdomain ?? this.subdomain;
    this.label = data.subdomain ?? this.label;

    const app = core.userAppTree.children.get(this.subdomain);

    this.iconName = app?.iconName ?? getIconName(data) ?? this.iconName ?? "off";
    this.iconPath = getIconPath(this.context, this.iconName);

    this.tooltip = t(`app.status.${this.iconName}`) + " - " + this.label;

    this.collapsibleState =
      this.children.size ?
        this.data.collapsibleState ??
        TreeItemCollapsibleState.Collapsed :
        TreeItemCollapsibleState.None;

    return this;
  }
}
