import { type ExtensionContext } from "vscode";
import "./@prototypes";
import ExtensionCore from "./core/extension";
import { localize } from "./localize";

export async function activate(context: ExtensionContext) {
  await localize(context);
  await new ExtensionCore(context).activate();
}

// This method is called when your extension is deactivated
export function deactivate() {}
