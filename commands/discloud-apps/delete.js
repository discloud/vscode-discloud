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

    const quest = await vscode.window.showInformationMessage(
      "Deseja realmente deletar essa Aplicação?",
      "Sim",
      "Cancelar"
    );
    if (quest === "Cancelar") {
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
        
        let upBar = this.discloud.bars.get("upload_bar")
        if(!upBar._visible) this.discloud.loadStatusBar()

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
