import CustomDomainTreeItem from "../structures/CustomDomainTreeItem";
import BaseTreeDataProvider from "./BaseTreeDataProvider";

export default class CustomDomainTreeDataProvider extends BaseTreeDataProvider {
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

    for (const domain of data) {
      this.children.set(domain, new CustomDomainTreeItem({
        label: domain,
        domain,
      }));
    }

    this.clean(data);
    this.refresh();
  }
}
