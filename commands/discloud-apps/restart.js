const { Command } = require("../../structures/command");
const { requester } = require("../../functions/requester");
const vscode = require("vscode");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "restartEntry",
    });
  }

  run = async (item) => {
    const token = this.discloud.config.get("token");
    if (!token) {
      return;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Reinciar Aplicação",
      },
      async (progress) => {
        progress.report({ message: ` Iniciando Processo...` });

        const restart = await requester(`/app/${item.tooltip}/restart`, {
          headers: {
            
            "api-token": token,
          },
          method: "PUT",
        });

        if (!restart) {
          return;
        }

        progress.report({ increment: 100 });
        vscode.window.showInformationMessage(`${restart.message}`);
        this.discloud.mainTree?.refresh();
      }
    );
  };
};
