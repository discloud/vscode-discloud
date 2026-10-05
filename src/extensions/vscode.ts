import { join } from "path";
import { type ExtensionContext, type TreeItem, Uri } from "vscode";
import { RESOURCES_DIR } from "../utils/constants";

const _defaultIconExtension = "svg";
const _darkIconDirname = "dark";
const _lightIconDirname = "light";

export default function assignVscodeExtensions(context: ExtensionContext) {
  context.iconPath ??= function (iconName: string, iconExt = _defaultIconExtension): TreeItem["iconPath"] {
    return {
      dark: Uri.file(this.asAbsolutePath(join(RESOURCES_DIR, _darkIconDirname, `${iconName}.${iconExt}`))),
      light: Uri.file(this.asAbsolutePath(join(RESOURCES_DIR, _lightIconDirname, `${iconName}.${iconExt}`))),
    };
  };
}

declare module "vscode" {
  interface ExtensionContext {
    iconPath(iconName: string, iconExt?: string): TreeItem["iconPath"]
  }
}
