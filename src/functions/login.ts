import * as vscode from 'vscode';
import { AppTreeDataProvider } from './api/tree';

export async function login(tree?: AppTreeDataProvider) {
  const input = await vscode.window.showInputBox({
    prompt: "API TOKEN",
    title: "Coloque seu Token da API da Discloud aqui.",
  });
  if (!input) {
    vscode.window.showErrorMessage("Token inválido.");
    return;
  }
  vscode.workspace.getConfiguration("discloud").update("token", input, true);
  vscode.window.showInformationMessage("Token configurado com sucesso!");
  tree ? await tree.refresh() : false;
}