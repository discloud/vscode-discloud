import { type Disposable, type TreeItem } from "vscode";
import { type AppType } from "../@enum";
import { type TeamAppChildTreeItemData } from "../@types";
import BaseChildTreeItem from "./BaseChildTreeItem";
import DisposableMap from "./DisposableMap";

export default class TeamAppChildTreeItem extends BaseChildTreeItem {
  readonly children = new DisposableMap<number, TreeItem & Disposable>();
  readonly iconName?: string;
  readonly appId: string;
  type: AppType | null = null;
  online: boolean | null = null;

  constructor(data: TeamAppChildTreeItemData) {
    super(data.label, data.collapsibleState);
    this.iconName = data.iconName;
    this.appId = data.appId;

    this._patch(data);
  }

  get contextJSON() {
    return {
      online: this.online,
      type: this.type,
    };
  }

  _patch(data: Partial<TeamAppChildTreeItemData>) {
    if (!data) return this;

    super._patch(data);

    if (data.appType !== undefined) this.type = data.appType;

    if (data.online !== undefined) this.online = data.online;

    this.tooltip = data.tooltip ?? this.description ? `${this.description}: ${this.label}` : `${this.label}`;

    if (data.children) {
      this.children.dispose();

      for (let i = 0; i < data.children.length; i++) {
        const child = data.children[i];
        this.children.set(i, child);
      }
    }

    return this;
  }
}
