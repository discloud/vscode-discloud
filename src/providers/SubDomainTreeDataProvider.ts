import { type ExtensionContext } from "vscode";
import SubDomainTreeItem from "../structures/SubDomainTreeItem";
import { TreeViewIds } from "../util/constants";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

type Item = SubDomainTreeItem

export default class SubDomainTreeDataProvider extends BaseTreeDataProvider<Item> {
  constructor(context: ExtensionContext) {
    super(context, TreeViewIds.discloudSubdomains);
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

    for (const subdomain of data) {
      this.children.set(subdomain, new SubDomainTreeItem({
        label: subdomain,
        subdomain,
      }));
    }

    this.refresh();
  }
}
