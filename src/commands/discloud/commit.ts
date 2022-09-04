import { Command } from "../../structures/command";
import * as vscode from "vscode";
import { Discloud } from "../../structures/extend";
import { Zip } from "../../functions/zip";
import { statSync, unlinkSync, WriteStream } from "fs";
import { FormData } from "undici";
import { requester } from "../../functions/requester";
import { User } from "../../types/apps";
import { streamtoBlob } from "../../functions/streamToBlob";

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
          progress.report({ increment: 100 });
          return vscode.window.showInformationMessage(
            "Nenhum arquivo foi encontrado."
          );
        }

        await progress.report({
          message: " Requisitando Aplicações..."
        });

        const userApps: User = await requester("/vscode", {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "api-token": `${token}`,
          },
          method: "GET",
        });

        if (!userApps) {
          progress.report({ increment: 100 });
          return vscode.window.showErrorMessage(
            "Nenhuma Aplicação encontrada."
          );
        }

        const hasBar = this.discloud.bars.get('upload_bar');
        console.log(hasBar);
        if (hasBar && ["$(cloud-upload) Upload Discloud", "$(loading~spin) Upload Discloud"].includes(`${hasBar?.text}`)) {
          hasBar.text = "$(loading~spin) Commiting Discloud";
          hasBar.show();
        }

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
          console.log(progress);
          //progress.report({ increment: 100 });
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

        const savePath = `${targetPath}\\commit.zip`;

        const { zip, stream } = new Zip(savePath, "zip", {
          zlib: {
            level: 9,
          },
        });

        if (!zip) {
          progress.report({ increment: 100 });
          return vscode.window.showInformationMessage(
            "Alguma Coisa com seu .zip deu errado."
          );
        }

        for await (const pth of paths) {
          if (pth === savePath) { continue; }
          const splitted = pth.replaceAll("\r", "").split("\\");
          const newPath = pth[0].toLowerCase() + pth.slice(1);
          statSync(newPath.replaceAll("\r", "")).isDirectory()
            ? zip.directory(pth, splitted[splitted.length - 1])
            : zip.file(pth, { name: splitted[splitted.length - 1] });
        }

        stream?.on("close", async () => {
          const form = new FormData();
          form.append("file", await streamtoBlob(savePath), "commit.zip");

          let finalID = "";

          const check =
            typeof hasOtherName !== "boolean"
              ? (hasOtherName as { name: string; id: string }[])?.filter(
                  (r) => r.name === input
                )
              : [];

          if (check.length > 0) {
            finalID = check[0].id;
          } else {
            finalID = input.split("|")[1].trim();
          }

          const data = await requester(`/app/${finalID}/commit`, {
            headers: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              "api-token": `${token}`
            },
            method: "PUT",
            body: form
          });

          await unlinkSync(savePath);
          await progress.report({ increment: 100 });
          hasBar?.hide();
          if (!data) {
            return;
          }
          vscode.window.showInformationMessage(`${data?.message}`);
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
