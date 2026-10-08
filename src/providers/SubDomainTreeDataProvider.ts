import type ExtensionCore from "../core/extension";
import SubDomainTreeItem from "../structures/SubDomainTreeItem";
import { TreeViewIds } from "../utils/constants";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

type Item = SubDomainTreeItem

export default class SubDomainTreeDataProvider extends BaseTreeDataProvider<Item> {
  constructor(core: ExtensionCore) {
    super(core, TreeViewIds.discloudSubdomains);
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
      this.children.set(subdomain, new SubDomainTreeItem(this.core, {
        label: subdomain,
        subdomain,
      }));
    }

    this.refresh();
  }
}
