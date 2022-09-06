import * as vscode from "vscode";
import { AppTreeDataProvider } from "../api/tree";
import { login } from "../login";

export async function checkIfHasToken(tree?: AppTreeDataProvider) {
    const token = vscode.workspace
      .getConfiguration("discloud")
      .get("token") as string;
    if (!token || token.length < 0) {
      const ask = await vscode.window.showWarningMessage(
        "Você não tem um Token configurado. Deseja configurar um?",
        "Sim",
        "Não"
      );

      if (ask === "Sim") {
        const tree = 
        await login();
      } else {
        return;
      }
    }
  
    return token;
  }