import { Command } from "../../structures/command";
import * as vscode from "vscode";
import { Discloud } from "../../structures/extend";

export = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "logIn",
    });
  }

  run = async () => {
    const input = await vscode.window.showInputBox({
      prompt: "API TOKEN",
      title: "Coloque seu Token da API da Discloud aqui.",
    });
    if (!input) {
      return vscode.window.showErrorMessage("Token inválido.");
    }
    vscode.workspace.getConfiguration("discloud").update("token", input);
    vscode.window.showInformationMessage("Token configurado com sucesso!");
  };
};