const vscode = require("vscode");
const { AppTreeDataProvider } = require("../api/tree");
const { login } = require("../login");

export async function checkIfHasToken(tree) {
    const token = vscode.workspace
      .getConfiguration("discloud")
      .get("token");
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