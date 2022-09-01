import { Command } from "../../structures/command";
import * as vscode from "vscode";
import { Discloud } from "../../structures/extend";
import { Zip } from "../../functions/zip";
import { statSync, unlinkSync, createReadStream, WriteStream } from "fs";
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
    if (!token) {
      return;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Commit",
        cancellable: true,
      },
      async (progress, tk) => {
        await vscode.commands.executeCommand("copyFilePath");
        const folders = await vscode.env.clipboard.readText();
        const paths = folders.split("\n");

        if (!folders) {
          return vscode.window.showInformationMessage(
            "Nenhum arquivo foi encontrado."
          );
        }

        progress.report({ message: "Commit - Requisitando suas Aplicações...", increment: 20 });

        const userApps: User = await requester("get", "/vscode", {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "api-token": `${token}`,
          },
        });

        if (!userApps) { return vscode.window.showErrorMessage(
          "Nenhuma Aplicação encontrada."
        ); }

        const getApps = await userApps.user.appsStatus;
        let hasOtherName: boolean | { name: string; id: string }[] = false;
        const verify = getApps.filter((r) => r.name.includes("|"));
        if (verify.length > 0) {
          hasOtherName = verify.map((r) => {
            return { name: `${r.name} | ${r.id}`, id: r.id };
          });
        }
        const apps = getApps.map((r) => {
          return `${r.name} | ${r.id}`;
        });
        const input = await vscode.window.showQuickPick(apps, {
          canPickMany: false,
          title: "Escolha uma aplicação.",
        });
        if (!input) {
          return vscode.window.showErrorMessage(
            "Aplicação incorreta ou inexistente."
          );
        }

        let targetPath = "";

        const workspaceFolders = vscode.workspace.workspaceFolders || [];

        if (workspaceFolders && workspaceFolders.length) {
          targetPath = workspaceFolders[0].uri.fsPath;
        } else {
          vscode.window.showErrorMessage("Nenhum arquivo encontrado.");
          return;
        }

        progress.report({ message: "Commit - Criando arquivo Zip...", increment: 40 });

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

        progress.report({ message: "Commit - Adicionando seus arquivos ao Zip...", increment: 60 });

        for await (const pth of paths) {
          const splitted = pth.replaceAll("\r", "").split("\\");
          const newPath = pth[0].toLowerCase() + pth.slice(1);
          statSync(newPath.replaceAll("\r", "")).isDirectory()
            ? zip.directory(pth, splitted[splitted.length - 1])
            : zip.file(pth, { name: splitted[splitted.length - 1] });
        }

        stream?.on("close", async () => {
          const form = new FormData();
          form.append("commitFile", createReadStream(savePath));

          progress.report({ message: "Commit - Requisitando Commit...", increment: 80 });

          let finalID = "";

          const check = typeof hasOtherName === 'object' ? (hasOtherName as { name: string; id: string }[])?.filter(
            (r) => r.name === input
          ) : []; 
          if (check.length > 0) {
            finalID = check[0].id;
          } else {
            finalID = input.split("|")[1].trim();
          }

          const data = await requester(
            "put",
            `/app/${finalID}/commit`,
            {
              headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "api-token": `${token}`,
              },
            },
            { d: form }
          );

          await unlinkSync(savePath);
          progress.report({ increment: 100 });
          await vscode.window.showInformationMessage(`${data?.message}`);
        });

        zip?.on("error", (err) => {
          vscode.window.showErrorMessage(JSON.stringify(err));
        });

        zip?.pipe(stream as WriteStream);
        zip?.finalize();
      }
    );
  };
};
