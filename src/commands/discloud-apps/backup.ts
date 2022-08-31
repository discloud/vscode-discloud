import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
import * as vscode from "vscode";
import { Backup, BackupApp } from "../../types/apps";
import axios from "axios";
import { download } from "../../functions/download";

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

    const downloadFile = await download(
      `${(<BackupApp>backup.backups).url}`
    );
    if (!downloadFile) {
      return;
    }

    const folderPathParsed = downloadFile.split(`\\`).join(`/`);
    const folderUri = vscode.Uri.file(folderPathParsed);

    const ask = await vscode.window.showInformationMessage(
      `Arquivo Criado com Sucesso`,
      `Abrir o Diretório`
    );
    if (ask === "Abrir o Diretório") {
      return vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
    }
    } else {
    return vscode.window.showErrorMessage(
     `Ocorreu algum erro durante o Backup de sua Aplicação. Tente novamente mais tarde.`
    );
       }
  };
};
