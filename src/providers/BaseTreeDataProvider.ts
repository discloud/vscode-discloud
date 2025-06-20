import { EventEmitter, type ExtensionContext, type ProviderResult, type TreeDataProvider, type TreeItem, window } from "vscode";
import type BaseTreeItem from "../structures/BaseTreeItem";
import DisposableMap from "../structures/DisposableMap";

export default abstract class BaseTreeDataProvider<V extends BaseTreeItem<any>, K = string> implements TreeDataProvider<V> {
  protected readonly _onDidChangeTreeData = new EventEmitter<V | V[] | null | void>();
  onDidChangeTreeData = this._onDidChangeTreeData.event.bind(this._onDidChangeTreeData);
  readonly children = new DisposableMap<K, V>();

  constructor(readonly context: ExtensionContext, readonly viewId: string) {
    const disposable = window.registerTreeDataProvider(viewId, this);

    context.subscriptions.push(disposable, this._onDidChangeTreeData, this.children);
  }

  getChildren(element?: V): ProviderResult<V[]> {
    return element?.children?.values().toArray() ?? this.children.values().toArray();
  }

  getTreeItem(element: V): TreeItem | Thenable<TreeItem> {
    return element;
  }

  refresh(data?: V | V[] | null) {
    this._onDidChangeTreeData.fire(data);
  }
}
