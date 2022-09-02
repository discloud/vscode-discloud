import * as vscode from "vscode";
import { login } from "../login";

export async function checkIfHasToken() {
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
        await login();
      } else {
        return;
      }
    }
  
    return token;
  }