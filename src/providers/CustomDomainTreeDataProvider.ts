import { type ExtensionContext } from "vscode";
import CustomDomainTreeItem from "../structures/CustomDomainTreeItem";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class CustomDomainTreeDataProvider extends BaseTreeDataProvider<CustomDomainTreeItem> {
  constructor(context: ExtensionContext) {
    super(context, "discloud-domains");
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
