import * as vscode from "vscode";

export async function checkIfHasToken() {
    const token = vscode.workspace
      .getConfiguration("discloud")
      .get("token") as string;
    if (!token || token.length < 0) {
      const ask = await vscode.window.showWarningMessage(
        "Você não tem um Token configurado. Deseja configurar um?",
        {},
        "(Sim)[command:discloud.logIn]",
        "Não"
      );
    }
  
    return token;
  }