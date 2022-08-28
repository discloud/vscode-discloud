import * as vscode from "vscode";
import { checkIfHasToken } from "./functions/checkers/token";

import { AppTreeDataProvider } from "./functions/api/tree";
import { Discloud } from "./structures/extend";

let uploadBar: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
  uploadBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    40
  );
  uploadBar.command = "discloud.upload";
  uploadBar.text = "$(cloud-upload) Upload to Discloud";
  context.subscriptions.push(uploadBar);
  uploadBar.show();

  const apps = new AppTreeDataProvider();
  vscode.window.registerTreeDataProvider("discloud-apps", apps);

  const discloud = new Discloud(context);
}
export function deactivate() {}