const { requester } = require("../../functions/requester");
const { Command } = require("../../structures/command");
const vscode = require("vscode");
const { download } = require("../../functions/download");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "backupEntry",
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
        title: "Backup da Aplicação",
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
          const downloadFile = await download(`${backup?.backups?.url}`);
          if (!downloadFile) {
            return;
          }

          progress.report({
            message: " Backup Baixado com sucesso!",
            increment: 100,
          });

          vscode.window.showInformationMessage(`Arquivo Criado com Sucesso`);
        } else {
          return vscode.window.showErrorMessage(
            `Ocorreu algum erro durante o Backup de sua Aplicação. Tente novamente mais tarde.`
          );
        }
      }
    );
  };
};
