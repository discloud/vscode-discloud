import { t } from "@vscode/l10n";
import { type ExtensionContext, type IconPath, TreeItem } from "vscode";
import { EMPTY_TREE_ITEM_ID } from "../utils/constants";
import { getIconPath } from "../utils/vscode";

const _emptyContextValue = "EmptyTreeItem";

export default class EmptyAppListTreeItem extends TreeItem {
  constructor(readonly context: ExtensionContext) {
    super(t("no.app.found"));

    this.iconPath = getIconPath(this.context, EMPTY_TREE_ITEM_ID);
  }

  readonly contextValue = _emptyContextValue;
  readonly iconPath?: string | IconPath;
}
