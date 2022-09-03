import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
import * as vscode from "vscode";

export = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "restartEntry",
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
        title: "Reinciar Aplicação",
      },
      async (progress, tk) => {

        progress.report({ message: `Reinciar Aplicação - Reinciando Aplicação...` });

        const restart = await requester(
          `/app/${item.tooltip}/restart`,
          {
            headers: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              "api-token": token,
            },
            method: "PUT"
          }
        );

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
