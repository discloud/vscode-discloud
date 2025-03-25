import { type ExtensionContext } from "vscode";
import CustomDomainTreeItem from "../structures/CustomDomainTreeItem";
import { TreeViewIds } from "../util/constants";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

type Item = CustomDomainTreeItem;

export default class CustomDomainTreeDataProvider extends BaseTreeDataProvider<Item> {
  constructor(context: ExtensionContext) {
    super(context, TreeViewIds.discloudDomains);
  }

  private clean(data: string[]) {
    for (const child of this.children.keys()) {
      if (!data.includes(child)) {
        this.children.dispose(child);
      }
    }
  }

  update(data: string[]) {
    if (!data) return;

    this.clean(data);

    for (const domain of data) {
      this.children.set(domain, new CustomDomainTreeItem({
        label: domain,
        domain,
      }));
    }
    this.refresh();
  }
}
