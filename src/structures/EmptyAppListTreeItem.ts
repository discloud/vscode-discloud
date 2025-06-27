import { t } from "@vscode/l10n";
import { TreeItem } from "vscode";
import { EMPTY_TREE_ITEM_ID } from "../util/constants";
import { getIconPath } from "../util/utils";

export default class EmptyAppListTreeItem extends TreeItem {
  constructor() {
    super(t("no.app.found"));
  }

  contextValue = "EmptyTreeItem";
  iconPath = getIconPath(EMPTY_TREE_ITEM_ID);
}
