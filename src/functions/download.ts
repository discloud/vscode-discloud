import * as vscode from "vscode";
import down from "download";
import { existsSync, mkdirSync } from "fs";

export async function download(url: string, uncompact: boolean = false) {
  let targetPath = "";

  const workspaceFolders = vscode.workspace.workspaceFolders || [];

  if (workspaceFolders && workspaceFolders.length) {
    targetPath = workspaceFolders[0].uri.fsPath;
  } else {
    vscode.window.showErrorMessage("Nenhum arquivo encontrado.");
    return;
  }

  if (!targetPath) {
    vscode.window.showErrorMessage("Alguma coisa deu errado com seu Zip.");
    return;
  }

  if (!existsSync(targetPath + "\\backup")) {
    mkdirSync(targetPath + "\\backup");
  }

  uncompact ? await down(url, targetPath + "\\backup", { extract: true }) : await down(url, targetPath + "\\backup");

  return targetPath + "\\backup";
}
