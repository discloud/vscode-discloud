const vscode = require("vscode");
// eslint-disable-next-line no-unused-vars
const Discloud = require("../structures/extend");
const { tokenValidator } = require("./tokenValidator");

/** @param {Discloud} discloud */
async function login(discloud) {
  const input = await vscode.window.showInputBox({
    prompt: "API TOKEN",
    title: "Coloque seu Token da API da Discloud aqui.",
    password: true
  });
  if (!input || !tokenValidator(input)) {
    vscode.window.showErrorMessage("Token inválido.");
    return;
  }
  vscode.workspace.getConfiguration("discloud").update("token", input, true);
  vscode.window.showInformationMessage("Token configurado com sucesso!");
  discloud.mainTree ? await discloud.mainTree.refresh() : false;
};

module.exports = { login }