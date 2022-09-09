const { requester } = require("../../functions/requester");
const { Command } = require("../../structures/command");
const vscode = require("vscode");
const { createLogs } = require("../../functions/toLogs");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "logsEntry",
    });
  }

  run = async (item) => {
    const token = this.discloud.config.get("token");
    if (!token) {
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    if (workspaceFolders.length == 0) {
      vscode.window.showErrorMessage("Você precisa abrir alguma pasta com o VSCode antes de realizar essa ação.");
      return;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Logs da Aplicação",
      },
      async (progress) => {
        const logs = await requester(`/app/${item.tooltip}/logs`, {
          headers: {
            
            "api-token": token,
          },
          method: "GET",
        });

        if (!logs) {
          return;
        }

        progress.report({
          message: " Logs recebidas com sucesso.",
          increment: 100,
        });

        return createLogs(
          "Logs acessadas com sucesso. Selecione uma das Opções:",
          {
            text: logs.apps.terminal.big,
            link: logs.apps.terminal.url,
          },
          { type: "withLink" }
        );
      }
    );
  };
};
