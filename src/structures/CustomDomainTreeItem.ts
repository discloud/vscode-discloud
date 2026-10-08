import { t } from "@vscode/l10n";
import { TreeItemCollapsibleState } from "vscode";
import type { CustomDomainTreeItemData } from "../@types";
import type ExtensionCore from "../core/extension";
import { getIconName } from "../utils/utils";
import { getIconPath } from "../utils/vscode";
import BaseTreeItem from "./BaseTreeItem";

export default class CustomDomainTreeItem extends BaseTreeItem<any> {
  declare domain: string;
  declare iconName: string;

  constructor(core: ExtensionCore, public data: CustomDomainTreeItemData) {
    data.label ??= data.domain;

    super(core, data.label, data.collapsibleState);

    this._patch(data);
  }

  protected _patch(data: Partial<CustomDomainTreeItemData>): this {
    if (!data) return this;

    super._patch(data);

    this.domain = data.domain ?? this.domain;
    this.label = data.domain ?? this.label;

    this.iconName = getIconName(data) ?? this.iconName ?? "off";
    this.iconPath = getIconPath(this.core.context, this.iconName);

    this.tooltip = t(`app.status.${this.iconName}`) + " - " + this.label;

    this.collapsibleState =
      this.children.size ?
        this.data.collapsibleState ??
        TreeItemCollapsibleState.Collapsed :
        TreeItemCollapsibleState.None;

    return this;
  }
}
