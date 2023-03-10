import { CancellationToken, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, window } from "vscode";
import extension from "../extension";
import BaseTreeItem from "../structures/BaseTreeItem";

export default abstract class BaseTreeDataProvider<T extends BaseTreeItem<any>> implements TreeDataProvider<T> {
  protected _onDidChangeTreeData = new EventEmitter<T | T[] | null | undefined | void>();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  children: Map<string, T> = new Map();

  constructor(public viewId: string) {
    const disposable = window.registerTreeDataProvider(viewId, this);

    extension.subscriptions.push(disposable, this._onDidChangeTreeData);

    this.onDidChangeTreeData((e) => {
      if (e) this.refresh();
    });
  }
  getTreeItem(element: T): TreeItem | Thenable<TreeItem> {
    return element;
  }
  getChildren(element?: NonNullable<T>): ProviderResult<T[]> {
    return [...element?.children?.values() ?? this.children.values()];
  }
  getParent?(element: T): ProviderResult<T> {
    return element;
  }
  resolveTreeItem?(item: TreeItem, element: T, _token: CancellationToken): ProviderResult<TreeItem> {
    return element ?? item;
  }

  refresh(data: T | T[] | null | undefined | void) {
    this._onDidChangeTreeData.fire(data);
  }
}