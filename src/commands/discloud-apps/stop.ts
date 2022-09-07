import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
const vscode = require("vscode");

module.exports = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "stopEntry",
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
        title: "Parar Aplicação",
      },
      async (progress, tk) => {

        progress.report({ message: ` Pararando Aplicação...` });

        const stop = await requester(
          `/app/${item.tooltip}/stop`,
          {
            headers: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              "api-token": token
            },
            method: "PUT"
          }
        );

        if (!stop) {
          return;
        }

        progress.report({ increment: 100 });
        vscode.window.showInformationMessage(`${stop.message}`);
        this.discloud.mainTree?.refresh();
      }
    );
  };
};
