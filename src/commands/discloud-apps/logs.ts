import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
import * as vscode from "vscode";
import { writeFileSync } from "fs";
import { AppLog, Logs } from "../../types/apps";
import { join } from "path";

export = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "logsEntry",
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
        title: "Logs da Aplicação",
      },
      async (progress, tk) => {
        const logs: Logs = await requester("get", `/app/${item.tooltip}/logs`, {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "api-token": token,
          },
        });

        if (!logs) {
          return;
        }

        progress.report({
          message: "Logs da Aplicação - Logs recebidas com sucesso.",
          increment: 100,
        });

        const ask = await vscode.window.showInformationMessage(
          "Logs acessadas com sucesso. Selecione uma das Opções:",
          "Abrir Arquivo",
          `Abrir Link`
        );
        if (ask === "Abrir Arquivo") {
          let targetPath = "";

          const workspaceFolders = vscode.workspace.workspaceFolders || [];

          if (workspaceFolders && workspaceFolders.length) {
            targetPath = workspaceFolders[0].uri.fsPath;
          } else {
            vscode.window.showErrorMessage("Nenhum arquivo encontrado.");
            return;
          }

          await writeFileSync(
            `${targetPath ? targetPath : join(__filename, "..", "..", "..", `${item.label?.toString().replaceAll(' ', '_').toLowerCase()}.log`)}`,
            (<AppLog>logs.apps).terminal.big
          );
          const fileToOpenUri: vscode.Uri = await vscode.Uri.file(
            join(__filename, "..", "..", "..", `${(<AppLog>logs.apps).id}.log`)
          );
          return vscode.window.showTextDocument(fileToOpenUri, {
            viewColumn: vscode.ViewColumn.Beside,
          });
        } else if (ask === "Abrir Link") {
          return vscode.env.openExternal(
            vscode.Uri.parse(`${(<AppLog>logs.apps).terminal.url}`)
          );
        }
      }
    );
  };
};
