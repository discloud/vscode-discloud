const { requester } = require("../../functions/requester");
const { Command } = require("../../structures/command");
const vscode = require("vscode");
const { download } = require("../../functions/download");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "importCode",
    });
  }

  run = async (item) => {
    const token = this.discloud.config.get("token");
    if (!token) {
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    if (workspaceFolders.length == 0) {
      vscode.window.showErrorMessage("Você precisa abrir alguma pasta com o VSCode antes de realizar essa ação.");
      return;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Importar Aplicação",
      },
      async (progress) => {
        const backup = await requester(`/app/${item.tooltip}/backup`, {
          headers: {
            "api-token": token,
          },
          method: "GET",
        });

        if (backup) {
          progress.report({
            message: " Backup da Aplicação recebido.",
            increment: 20,
          });
        }

        if (backup?.backups?.url) {
          progress.report({
            message: " Baixando Backup da Aplicação recebido.",
            increment: 40,
          });
          const downloadFile = await download(`${backup.backups?.url}`, true, item.label.trim());
          if (!downloadFile) {
            return;
          }

          progress.report({
            message: " Backup Baixado com sucesso! Descompactando...",
            increment: 60,
          });

          const folderPathParsed = downloadFile.split(`\\`).join(`/`);
          const folderUri = vscode.Uri.file(folderPathParsed);

          await progress.report({
            message: " Descompactado com sucesso!",
            increment: 100,
          });

          const ask = await vscode.window.showInformationMessage(
            `Arquivo Criado com Sucesso`,
            `Abrir o Diretório`
          );
          if (ask === "Abrir o Diretório") {
            return vscode.commands.executeCommand(
              `vscode.openFolder`,
              folderUri
            );
          }
        } else {
          return vscode.window.showErrorMessage(
            `Ocorreu algum erro durante o Backup de sua Aplicação. Tente novamente mais tarde.`
          );
        }
      }
    );
  };
};
