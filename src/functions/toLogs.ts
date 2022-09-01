import { writeFileSync } from "fs";
import { join } from "path";
import * as vscode from "vscode";

export async function createLogs(
  message: string,
  logs: { text: string; link?: string },
  logName: string
) {
  const ask = logs.link
    ? await vscode.window.showInformationMessage(
        message,
        "Abrir Logs",
        "Abrir Link"
      )
    : await vscode.window.showInformationMessage(message, "Abrir Logs");

  if (ask === "Abrir Logs") {
    let targetPath = "";

    const workspaceFolders = vscode.workspace.workspaceFolders || [];

    if (workspaceFolders && workspaceFolders.length) {
      targetPath = workspaceFolders[0].uri.fsPath;
    } else {
      vscode.window.showErrorMessage("Nenhum arquivo encontrado.");
      return;
    }

    await writeFileSync(
      targetPath
        ? targetPath + `\\${logName}`
        : join(__filename, "..", "..", "..", `${logName}`),
      logs.text
    );
    const fileToOpenUri: vscode.Uri = await vscode.Uri.file(
      targetPath ? targetPath + `\\${logName}` : join(__filename, "..", "..", "..", `${logName}`)
    );
    return vscode.window.showTextDocument(fileToOpenUri, {
      viewColumn: vscode.ViewColumn.Beside,
    });
  }

  if (logs.link) {
    if (ask === "Abrir Link") {
      return vscode.env.openExternal(vscode.Uri.parse(`${logs.link}`));
    }
  }
}
