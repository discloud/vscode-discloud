import { EventEmitter, type ExtensionContext, type ProviderResult, type TreeDataProvider, type TreeItem, window } from "vscode";
import type BaseTreeItem from "../structures/BaseTreeItem";
import DisposableMap from "../structures/DisposableMap";

export default abstract class BaseTreeDataProvider<T extends BaseTreeItem<any>> implements TreeDataProvider<T> {
  protected readonly _onDidChangeTreeData = new EventEmitter<T | T[] | null | void>();
  onDidChangeTreeData = this._onDidChangeTreeData.event.bind(this._onDidChangeTreeData);
  readonly children = new DisposableMap<string, T>();

  constructor(readonly context: ExtensionContext, readonly viewId: string) {
    const disposable = window.registerTreeDataProvider(viewId, this);

    context.subscriptions.push(disposable, this._onDidChangeTreeData, this.children);
  }

  getChildren(element?: T): ProviderResult<T[]> {
    return Array.from(element?.children?.values() ?? this.children.values());
  }

  getTreeItem(element: T): TreeItem | Thenable<TreeItem> {
    return element;
  }

  refresh(data?: T | T[] | null) {
    this._onDidChangeTreeData.fire(data);
  }
}
