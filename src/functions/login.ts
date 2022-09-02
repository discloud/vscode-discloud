import * as vscode from 'vscode';

export async function login() {
  const input = await vscode.window.showInputBox({
    prompt: "API TOKEN",
    title: "Coloque seu Token da API da Discloud aqui.",
  });
  if (!input) {
    return vscode.window.showErrorMessage("Token inválido.");
  }
  vscode.workspace.getConfiguration("discloud").update("token", input);
  vscode.window.showInformationMessage("Token configurado com sucesso!");
}