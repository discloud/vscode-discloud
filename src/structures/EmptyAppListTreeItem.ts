import { t } from "@vscode/l10n";
import { TreeItem } from "vscode";
import { EMPTY_TREE_ITEM_ID } from "../utils/constants";
import { getIconPath } from "../utils/utils";

export default class EmptyAppListTreeItem extends TreeItem {
  constructor() {
    super(t("no.app.found"));
  }

  contextValue = "EmptyTreeItem";
  iconPath = getIconPath(EMPTY_TREE_ITEM_ID);
}
