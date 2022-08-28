import * as vscode from "vscode";
import { Discloud } from "./structures/extend";

export async function activate(context: vscode.ExtensionContext) {
  new Discloud(context);
}
export function deactivate() {}