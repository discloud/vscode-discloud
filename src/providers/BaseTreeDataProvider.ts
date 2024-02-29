import { CancellationToken, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, window } from "vscode";
import extension from "../extension";
import BaseTreeItem from "../structures/BaseTreeItem";
import DisposableMap from "../structures/DisposableMap";

export default abstract class BaseTreeDataProvider<T extends BaseTreeItem<any>> implements TreeDataProvider<T> {
  protected readonly _onDidChangeTreeData = new EventEmitter<T | T[] | null | undefined | void>();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  readonly children = new DisposableMap<string, T>();

  constructor(public readonly viewId: string) {
    const disposable = window.registerTreeDataProvider(viewId, this);

    extension.subscriptions.push(disposable, this._onDidChangeTreeData, this.children);
  }
  getTreeItem(element: T): TreeItem | Thenable<TreeItem> {
    return element;
  }
  getChildren(element?: NonNullable<T>): ProviderResult<T[]> {
    return Array.from(element?.children?.values() ?? this.children.values());
  }
  getParent(element: T): ProviderResult<T> {
    return element;
  }
  resolveTreeItem(item: TreeItem, element: T, _token: CancellationToken): ProviderResult<TreeItem> {
    return element ?? item;
  }

  refresh(data: T | T[] | null | undefined | void) {
    this._onDidChangeTreeData.fire(data);
  }
}
