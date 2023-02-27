import { CancellationToken, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, window } from "vscode";
import extension from "../extension";

export default abstract class BaseTreeDataProvider<T> implements TreeDataProvider<T> {
  protected _onDidChangeTreeData = new EventEmitter<T | null | undefined | void>();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  children: Map<string, T> = new Map();

  constructor(public viewId: string) {
    const disposable = window.registerTreeDataProvider(viewId, this);
    extension.context.subscriptions.push(disposable, this._onDidChangeTreeData);
  }
  getTreeItem(element: T): TreeItem | Thenable<TreeItem> {
    return element as TreeItem;
  }
  getChildren(element?: NonNullable<T>): ProviderResult<T[]> {
    return [...(<any>element)?.children?.values() ?? this.children.values()];
  }
  getParent?(element: T): ProviderResult<T> {
    return element;
  }
  resolveTreeItem?(item: TreeItem, element: T, _token: CancellationToken): ProviderResult<TreeItem> {
    return element ?? item;
  }

  refresh(data: T | null | undefined | void) {
    this._onDidChangeTreeData.fire(data);
  }
}