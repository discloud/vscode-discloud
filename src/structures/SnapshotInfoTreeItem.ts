import { ThemeIcon } from "vscode";
import BaseChildTreeItem from "./BaseChildTreeItem";

export default class SnapshotInfoTreeItem extends BaseChildTreeItem {
  readonly contextKey = "SnapshotInfoTreeItem";

  constructor(label: string, description?: string) {
    super(label);
    this._patch({
      description,
      iconPath: new ThemeIcon("info"),
      label,
    });
  }
}
