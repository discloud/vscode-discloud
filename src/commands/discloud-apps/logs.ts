import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
const vscode = require("vscode");
import { AppLog, Logs } from "../../types/apps";
import { createLogs } from "../../functions/toLogs";

module.exports = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "logsEntry",
    });
  }

  run = async (item: TreeItem) => {
    const token = this.discloud.config.get("token") as string;
    if (!token) {
      return;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Logs da Aplicação",
      },
      async (progress, tk) => {
        const logs: Logs = await requester(`/app/${item.tooltip}/logs`, {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "api-token": token,
          },
          method: "GET"
        });

        if (!logs) {
          return;
        }

        progress.report({
          message: " Logs recebidas com sucesso.",
          increment: 100
        });

        return createLogs(
          "Logs acessadas com sucesso. Selecione uma das Opções:",
          {
            text: (<AppLog>logs.apps).terminal.big,
            link: (<AppLog>logs.apps).terminal.url
          },
          `${item.label?.toString().replaceAll(" ", "_").toLowerCase()}.log`,
          { type: "withLink" }
        );
      }
    );
  };
};
