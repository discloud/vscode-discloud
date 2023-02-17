import { CustomDomainTreeItemData } from "../@types";
import { getIconName, getIconPath } from "../util";
import BaseTreeItem from "./BaseTreeItem";

export default class CustomDomainTreeItem extends BaseTreeItem<any> {
  domain!: string;
  iconName!: string;

  constructor(public data: CustomDomainTreeItemData) {
    data.label ??= data.domain;

    super(data.label, data.collapsibleState);

    this._patch(data);
  }

  protected _patch(data: CustomDomainTreeItemData): this {
    this.domain = data.domain ?? this.domain;
    this.label = data.domain ?? this.label;
    this.collapsibleState = data.collapsibleState ?? this.collapsibleState;

    this.iconName = getIconName(data) ?? this.iconName ?? "off";
    this.iconPath = getIconPath(this.iconName);

    return super._patch(data);
  }
}