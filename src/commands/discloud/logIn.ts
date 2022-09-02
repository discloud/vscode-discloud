import { Command } from "../../structures/command";
import * as vscode from "vscode";
import { Discloud } from "../../structures/extend";
import { login } from "../../functions/login";

export = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "logIn",
    });
  }

  run = async () => {
    const tree = this.discloud.mainTree;
    await login(tree);
  };
};
