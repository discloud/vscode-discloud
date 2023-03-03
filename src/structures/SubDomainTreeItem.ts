import { TreeItemCollapsibleState } from "vscode";
import { SubDomainTreeItemData } from "../@types";
import extension from "../extension";
import { getIconName, getIconPath } from "../util";
import BaseTreeItem from "./BaseTreeItem";

export default class SubDomainTreeItem extends BaseTreeItem<any> {
  declare subdomain: string;
  declare iconName: string;

  constructor(public data: SubDomainTreeItemData) {
    data.label ??= data.subdomain;

    super(data.label, data.collapsibleState);

    this._patch(data);
  }

  protected _patch(data: SubDomainTreeItemData): this {
    super._patch(data);

    this.subdomain = data.subdomain ?? this.subdomain;
    this.label = data.subdomain ?? this.label;

    const app = extension.appTree.children.get(this.subdomain);

    this.iconName = app?.iconName ?? getIconName(data) ?? this.iconName ?? "off";
    this.iconPath = getIconPath(this.iconName);

    this.collapsibleState =
      this.children.size ?
        this.data.collapsibleState ??
        TreeItemCollapsibleState.Collapsed :
        TreeItemCollapsibleState.None;

    return this;
  }
}