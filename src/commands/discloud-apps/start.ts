import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
import * as vscode from "vscode";

export = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "startEntry",
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
        title: "Inicializando sua aplicação...",
      },
      async (progress, tk) => {
        const start = await requester(
          "put",
          `/app/${item.tooltip}/start`,
          {
            headers: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              "api-token": token,
            },
          },
          {}
        );

        if (!start) {
          return;
        }

        progress.report({ message: `${start.message}`, increment: 100 });
        vscode.commands.executeCommand("discloud-apps.refresh");
      }
    );
  };
};
