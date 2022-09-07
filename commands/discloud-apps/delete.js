const { requester } = require("../../functions/requester");
const { Command } = require("../../structures/command");
const vscode = require("vscode");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "deleteEntry",
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
        title: "Deletar Aplicação",
      },
      async (progress) => {
        if (!item.tooltip) {
          return vscode.window.showInformationMessage(
            "Aplicação não encontrada."
          );
        }

        progress.report({ message: " Deletando Aplicação..." });
        await requester(`/app/${item.tooltip}/delete`, {
          headers: {
            "api-token": token,
          },
          method: "DELETE",
        });

        progress.report({ increment: 100 });
        vscode.window.showInformationMessage(
          `Deletar Aplicação - Aplicação ${item.label} deletada com sucesso!`
        );
        const tree = this.discloud.mainTree;
        return tree
          ? await tree.refresh(
              tree?.data.filter((r) => r.tooltip !== item.tooltip)
            )
          : false;
      }
    );
  };
};
