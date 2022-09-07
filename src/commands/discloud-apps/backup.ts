import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
const vscode = require("vscode");
import { Backup, BackupApp } from "../../types/apps";
import { download } from "../../functions/download";

module.exports = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "backupEntry",
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
        title: "Backup da Aplicação",
      },
      async (progress, tk) => {
        const backup: Backup = await requester(
          `/app/${item.tooltip}/backup`,
          {
            headers: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              "api-token": token,
            },
            method: "GET"
          }
        );

        if (backup) {
          progress.report({ message: " Backup da Aplicação recebido.", increment: 20 });
        }
        
        if ((<BackupApp>backup?.backups)?.url) {
          progress.report({ message: " Baixando Backup da Aplicação recebido.", increment: 40 });
          const downloadFile = await download(`${(<BackupApp>backup.backups).url}`);
          if (!downloadFile) {
            return;
          }

          progress.report({ message: " Backup Baixado com sucesso!", increment: 100 });
    
          vscode.window.showInformationMessage(
            `Arquivo Criado com Sucesso`
          );
        } else {
          return vscode.window.showErrorMessage(
            `Ocorreu algum erro durante o Backup de sua Aplicação. Tente novamente mais tarde.`
          );
        }
        
      }
    );
  };
};
