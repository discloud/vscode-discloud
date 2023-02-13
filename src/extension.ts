import { ExtensionContext } from "vscode";
import "./localize";
import Discloud from "./structures/Discloud";

const extension = new Discloud();
export default extension;

export async function activate(context: ExtensionContext) {
	await extension.loadEvents();
	extension.activate(context);
}

// This method is called when your extension is deactivated
export function deactivate() { }
