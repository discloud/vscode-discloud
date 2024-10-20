import { type Disposable, TreeItem, type TreeItemCollapsibleState, type TreeItemLabel } from "vscode";
import DisposableMap from "./DisposableMap";

export default abstract class BaseTreeItem<T extends TreeItem & Disposable> extends TreeItem {
  readonly children = new DisposableMap<string, T>();
  declare readonly data: unknown;

  contextValue = "TreeItem";

  constructor(label: string | TreeItemLabel, collapsibleState?: TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }

  dispose() {
    this.children.dispose();
  }

  protected _clone(): this {
    return Object.assign(Object.create(this), this);
  }

  protected _patch(data: unknown): this;
  protected _patch(data: any): this {
    if (data) {
      Object.assign(<any>this.data, data);

      if ("accessibilityInformation" in data)
        this.accessibilityInformation = data.accessibilityInformation;

      if ("checkboxState" in data)
        this.checkboxState = data.checkboxState;

      if ("collapsibleState" in data)
        this.collapsibleState = data.collapsibleState;

      if ("command" in data)
        this.command = data.command;

      if ("description" in data)
        this.description = data.description;

      if ("iconPath" in data)
        this.iconPath = data.iconPath;

      if ("label" in data)
        this.label = data.label;

      if ("resourceUri" in data)
        this.resourceUri = data.resourceUri;

      if ("tooltip" in data)
        this.tooltip = data.tooltip;
    }

    return this;
  }

  protected _update(data: unknown): this {
    const clone = this._clone();
    this._patch(data);
    return clone;
  }
}
