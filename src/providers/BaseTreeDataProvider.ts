import { CancellationToken, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, window } from "vscode";
import extension from "../extension";

export default abstract class BaseTreeDataProvider<T = any> implements TreeDataProvider<T> {
  protected _onDidChangeTreeData = new EventEmitter<T>();
  get onDidChangeTreeData() {
    return this._onDidChangeTreeData.event;
  };
  children: Map<string, T> = new Map();

  constructor(public viewId: string) {
    const disposable = window.registerTreeDataProvider(viewId, this);
    extension.context.subscriptions.push(disposable);
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
  resolveTreeItem?(item: TreeItem, element: T, token: CancellationToken): ProviderResult<TreeItem> {
    return element ?? item;
  }

  refresh() {
    this._onDidChangeTreeData.fire(<T>undefined);
  }
}