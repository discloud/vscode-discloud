const vscode = require("vscode");
import { Discloud } from "./structures/extend";

module.exports = async function activate(context: vscode.ExtensionContext) {
  new Discloud(context);
}
module.exports = function deactivate() {}