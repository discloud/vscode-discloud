const { requester } = require("../../functions/requester");
const { Command } = require("../../structures/command");
const vscode = require("vscode");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "ramEntry",
    });
  }

  run = async (item) => {
    const token = this.discloud.config.get("token");
    if (!token) {
      return;
    }

    const toPut = await vscode.window.showInputBox({
      title: "Coloque a nova quantidade de RAM que o app irá usar.",
    });

    if (!toPut || !Number.isInteger(parseInt(`${toPut}`))) {
      return vscode.window.showErrorMessage(
        "Operação cancelada pois valor recebido é inválido."
      );
    }

    const obj = {
      ramMB: parseInt(`${toPut}`),
    };

    const ram = await requester(`/app/${item.tooltip}/ram`, {
      headers: {
        
        "api-token": token,
        
        "Content-type": "application/json",
      },
      body: JSON.stringify(obj),
      method: "PUT",
    });

    if (!ram) {
      return;
    }
    vscode.window.showInformationMessage(`${ram.message}`);
    await this.discloud.mainTree?.refresh();
  };
};
