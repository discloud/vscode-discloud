import SubDomainTreeItem from "../structures/SubDomainTreeItem";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class SubDomainTreeDataProvider extends BaseTreeDataProvider<SubDomainTreeItem> {
  constructor(viewId: string) {
    super(viewId);
  }

  private clean(data: string[]) {
    for (const child of this.children.keys()) {
      if (!data.includes(child)) {
        this.children.delete(child);
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
