import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
import * as vscode from "vscode";
import { Backup, BackupApp } from "../../types/apps";

export = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "importCode",
    });
  }

  run = async (item: TreeItem) => {
    const token = this.discloud.config.get("token") as string;

    const backup: Backup = await requester(
      "get",
      `/app/${item.tooltip}/backup`,
      {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "api-token": token,
        },
      }
    );

    if ((<BackupApp>backup.backups).url) {
      return vscode.window.showInformationMessage(
        `${backup.message} [Clique Aqui](${
          (<BackupApp>backup.backups).url
        })`
      );
    } else {
      return vscode.window.showErrorMessage(
        `Ocorreu algum erro durante o Backup de sua Aplicação. Tente novamente mais tarde.`
      );
    }
  };
};
