import { type ExtensionContext } from "vscode";
import SubDomainTreeItem from "../structures/SubDomainTreeItem";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class SubDomainTreeDataProvider extends BaseTreeDataProvider<SubDomainTreeItem> {
  constructor(context: ExtensionContext) {
    super(context, "discloud-subdomains");
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
