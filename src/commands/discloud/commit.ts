import { Command } from "../../structures/command";
import * as vscode from "vscode";
import { Discloud } from "../../structures/extend";
import { Zip } from "../../functions/zip";
import {
    statSync,
    unlinkSync,
    createReadStream,
    WriteStream,
  } from "fs";
import FormData from "form-data";
import { requester } from "../../functions/requester";
import { User } from "../../types/apps";

export = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "commit",
    });
  }

  run = async (uri: vscode.Uri) => {
    const token = this.discloud.config.get("token") as string;
    await vscode.commands.executeCommand("copyFilePath");
    const folders = await vscode.env.clipboard.readText();
    const paths = folders.split("\n");

    if (!folders) {
      return vscode.window.showInformationMessage(
        "Nenhum arquivo foi encontrado."
      );
    }

    const userApps: User = await requester("get", "/user", {
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "api-token": `${token}`
        }
    });
    

    const apps = await userApps.user.appsStatus.map(r => { return `${r.name} | ${r.id}`; });
    const input = await vscode.window.showQuickPick(apps, { canPickMany: false, title: "Escolha uma aplicação." });
    if (!input) {
        return vscode.window.showErrorMessage("Aplicação incorreta ou inexistente.");
    }

    let targetPath = "";

      const workspaceFolders = vscode.workspace.workspaceFolders || [];

      if (workspaceFolders && workspaceFolders.length) {
        targetPath = workspaceFolders[0].uri.fsPath;
      } else {
        vscode.window.showErrorMessage("Nenhum arquivo encontrado.");
        return;
      }

    const savePath = `${targetPath}\\commit.zip`;

    const { zip, stream } = new Zip(savePath, "zip", {
        zlib: {
          level: 9,
        },
      });

    if (!zip) {
      return vscode.window.showInformationMessage(
        "Alguma Coisa com seu .zip deu errado."
      );
    }

    for await (const pth of paths) {
      const splitted = pth.replace('\r', '').split("\\");
      statSync(paths[0][0].toLowerCase() + paths[0].slice(1, -1)).isDirectory() ? 
        zip.directory(pth, splitted[splitted.length - 1])
        : zip.file(pth, { name: splitted[splitted.length - 1] });
    }


    stream?.on("close", async () => {
      const form = new FormData();
      form.append("commitFile", createReadStream(savePath));

      const data = await requester(
        "put",
        `/app/${input.split('|')[1].replace(' ', '')}/commit`,
        {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "api-token": `${token}`,
          },
        },
        form
      );
      
      unlinkSync(savePath);
      vscode.window.showInformationMessage(`${data?.message}`);
    });

    zip?.on("error", (err) => {
      vscode.window.showErrorMessage(JSON.stringify(err));
    });

    zip?.pipe(stream as WriteStream);
    zip?.finalize();
  };
};