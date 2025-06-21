import { t } from "@vscode/l10n";
import { TreeItem } from "vscode";
import { getIconPath } from "../util/utils";

export default class EmptyAppListTreeItem extends TreeItem {
  constructor() {
    super(t("no.app.found"));
  }

  contextValue = "EmptyTreeItem";
  iconPath = getIconPath("x");
}
