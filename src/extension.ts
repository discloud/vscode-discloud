import { type ExtensionContext } from "vscode";
import ExtensionCore from "./core/extension";
import { localize } from "./localize";

const core = new ExtensionCore();
export default core;

export async function activate(context: ExtensionContext) {
  await localize(context);
  core.setContext(context);
  await core.activate();
}

// This method is called when your extension is deactivated
export function deactivate() {
  core.dispose();
}
