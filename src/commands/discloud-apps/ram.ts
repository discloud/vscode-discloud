import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
import * as vscode from "vscode";

export = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "ramEntry",
    });
  }

  run = async (item: TreeItem) => {
    const token = this.discloud.config.get("token") as string;
    if (!token) {
      return;
    }

    const toPut = await vscode.window.showInputBox({
      title: "Coloque a nova quantidade de RAM que o app irá usar.",
    });

    const ram = await requester(
      `/app/${item.tooltip}/ram`,
      {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "api-token": token,
        },
        body: {
          //@ts-ignore
          ramMB: parseInt(`${toPut}`),
        },
        method: "PUT"
      }
    );

    if (!ram) {
      return;
    }
    vscode.window.showInformationMessage(`${ram.message}`);
    this.discloud.mainTree?.refresh();
  };
};
