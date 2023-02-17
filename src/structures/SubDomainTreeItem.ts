import { SubDomainTreeItemData } from "../@types";
import { getIconName, getIconPath } from "../util";
import BaseTreeItem from "./BaseTreeItem";

export default class SubDomainTreeItem extends BaseTreeItem<any> {
  subdomain!: string;
  iconName!: string;

  constructor(public data: SubDomainTreeItemData) {
    data.label ??= data.subdomain;

    super(data.label, data.collapsibleState);

    this._patch(data);
  }

  protected _patch(data: SubDomainTreeItemData): this {
    this.subdomain = data.subdomain ?? this.subdomain;
    this.label = data.subdomain ?? this.label;
    this.collapsibleState = data.collapsibleState ?? this.collapsibleState;

    this.iconName = getIconName(data) ?? this.iconName ?? "off";
    this.iconPath = getIconPath(this.iconName);

    return super._patch(data);
  }
}