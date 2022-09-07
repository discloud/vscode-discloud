import { Command } from "../../structures/command";
const vscode = require("vscode");
import { Discloud } from "../../structures/extend";
import { login } from "../../functions/login";

module.exports = class extends Command {
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
