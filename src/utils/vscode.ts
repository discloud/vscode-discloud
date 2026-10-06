import { join } from "path";
import { type ExtensionContext, type TreeItem, Uri } from "vscode";
import { RESOURCES_DIR } from "./constants";

const _defaultIconExtension = "svg";
const _darkIconDirname = "dark";
const _lightIconDirname = "light";

export function getIconPath(context: ExtensionContext, iconName: string, iconExt = _defaultIconExtension): TreeItem["iconPath"] {
  return {
    dark: Uri.file(context.asAbsolutePath(join(RESOURCES_DIR, _darkIconDirname, `${iconName}.${iconExt}`))),
    light: Uri.file(context.asAbsolutePath(join(RESOURCES_DIR, _lightIconDirname, `${iconName}.${iconExt}`))),
  };
}
