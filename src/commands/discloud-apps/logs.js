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

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Logs da Aplicação",
      },
      async (progress, tk) => {
        const logs = await requester(`/app/${item.tooltip}/logs`, {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
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
          `${item.label?.toString().replaceAll(" ", "_").toLowerCase()}.log`,
          { type: "withLink" }
        );
      }
    );
  };
};
