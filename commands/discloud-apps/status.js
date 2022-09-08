const { requester } = require("../../functions/requester");
const { Command } = require("../../structures/command");
const vscode = require("vscode");
const { createStatus } = require("../../functions/toLogs");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "statusEntry",
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
        title: "Status da Aplicação",
      },
      async (progress) => {
        const status = await requester(`/app/${item.tooltip}/status`, {
          headers: {
            
            "api-token": token,
          },
          method: "GET",
        });

        if (!status) {
          return;
        }

        progress.report({
          message: " Status recebidas com sucesso.",
          increment: 100,
        });

        return createStatus(
          "Status acessadas com sucesso. Selecione uma das Opções:",
          {
            text: `Container: ${status.apps.container}\nRAM: ${status.apps.memory}\nCPU: ${status.apps.cpu}\nSSD NVMe: ${status.apps.ssd}\nNetwork: ⬆${status.apps.netIO.up} ⬇${status.apps.netIO.down}\nUptime: ${status.apps.last_restart}\n\nID:${status.apps.id}\n`
          },
          { type: "withLink" }
        );
      }
    );
  };
};
