import { t } from "@vscode/l10n";
import { type IconPath, TreeItem } from "vscode";
import type ExtensionCore from "../core";
import { EMPTY_TREE_ITEM_ID } from "../utils/constants";
import { getIconPath } from "../utils/vscode";

const _emptyContextValue = "EmptyTreeItem";

export default class EmptyAppListTreeItem extends TreeItem {
  constructor(readonly core: ExtensionCore) {
    super(t("no.app.found"));

    this.iconPath = getIconPath(core.context, EMPTY_TREE_ITEM_ID);
  }

  readonly contextValue = _emptyContextValue;
  readonly iconPath?: string | IconPath;
}
