import { TreeItem, TreeItemCollapsibleState, TreeItemLabel } from "vscode";
import { Constructor } from "../@types";

interface BaseTreeItem<T> {
  constructor: Constructor<T>
}

abstract class BaseTreeItem<T> extends TreeItem {
  children: Map<string, T> = new Map();
  data: unknown;

  constructor(label: string | TreeItemLabel, collapsibleState?: TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }

  contextValue = "TreeItem";

  protected _clone(): this {
    return Object.assign(Object.create(this), this);
  }

  protected _patch(data: unknown): this {
    if (typeof data === "object")
      this.data = { ...(this.data ?? {}), ...data };

    return this;
  }

  protected _update(data: unknown): this {
    const clone = this._clone();
    this._patch(data);
    return clone;
  }
}

export default BaseTreeItem;