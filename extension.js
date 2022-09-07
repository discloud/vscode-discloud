const Discloud = require("./structures/extend");
const vscode = require("vscode");

async function activate(context) {

  vscode.window.showInformationMessage("Eu iniciei mas você não pode me ver");
  new Discloud(context);
};
function deactivate() {};

module.exports = {
	activate,
	deactivate
}