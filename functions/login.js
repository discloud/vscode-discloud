const vscode = require("vscode");

async function login(tree) {
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
};

module.exports = { login }