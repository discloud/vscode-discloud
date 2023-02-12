import { TreeItem, TreeItemCollapsibleState, TreeItemLabel } from "vscode";
import { Constructor } from "../@types";

interface BaseTreeItem<T> {
  constructor: Constructor<T>
}

abstract class BaseTreeItem<T> extends TreeItem {
  children: Map<string, T> = new Map();

  constructor(label: string | TreeItemLabel, collapsibleState?: TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }

  protected _clone(): this {
    return Object.assign(Object.create(this), this);
  }

  protected _patch(data: unknown): this {
    return this;
  }

  protected _update(data: unknown): this {
    const clone = this._clone();
    this._patch(data);
    return clone;
  }
}

export default BaseTreeItem;