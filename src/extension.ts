import { type ExtensionContext } from "vscode";
import { localize } from "./localize";
import Discloud from "./structures/Discloud";

const extension = new Discloud();
export default extension;

export async function activate(context: ExtensionContext) {
  await localize(context);
  await extension.activate(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
  extension.dispose();
}
