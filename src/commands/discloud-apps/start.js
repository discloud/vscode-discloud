const { Command } = require("../../structures/command");
const { requester } = require("../../functions/requester");
const vscode = require("vscode");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "startEntry",
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
        title: "Iniciar Aplicação",
      },
      async (progress, tk) => {
        progress.report({ message: ` Inicializando Aplicação...` });

        const start = await requester(`/app/${item.tooltip}/start`, {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "api-token": token,
          },
          method: "PUT",
        });

        if (!start) {
          return;
        }

        progress.report({ increment: 100 });
        vscode.window.showInformationMessage(`${start.message}`);
        this.discloud.mainTree?.refresh();
      }
    );
  };
};
