import { ExtensionContext, window } from "vscode";
import "./localize";
import Discloud from "./structures/Discloud";

export const logger = window.createOutputChannel("Discloud", { log: true });

process.on("beforeExit", (code) => logger.info("Exit code: " + code));
process.on("uncaughtExceptionMonitor", logger.error);

const extension = new Discloud();
export default extension;

export async function activate(context: ExtensionContext) {
  await extension.loadEvents();
  extension.activate(context);
}

// This method is called when your extension is deactivated
export function deactivate() { }
