import { type ExtensionContext, window } from "vscode";
import { localize } from "./localize";
import Discloud from "./structures/Discloud";

export const logger = window.createOutputChannel("Discloud", { log: true });

const extension = new Discloud();
export default extension;

export async function activate(context: ExtensionContext) {
  context.subscriptions.push(logger);
  localize(context);
  await extension.loadEvents();
  extension.activate(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
  extension.dispose();
}
