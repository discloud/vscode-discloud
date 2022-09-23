const { Command } = require("../../structures/command");
const { blockedFullFiles } = require("../../config.json");
const vscode = require("vscode");
const { Zip } = require("../../functions/zip");
const { statSync, unlinkSync } = require("fs");
const { FormData } = require("undici");
const { requester } = require("../../functions/requester");
const { resolve } = require("path");
const { streamtoBlob } = require("../../functions/streamToBlob");

const regex = RegExp(`(${blockedFullFiles.join('|')})`, 'i')

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "commit",
    });
  }

  run = async () => {
    const token = this.discloud.config.get("token");
    if (!token) {
      return;
    }

    const hasBar = await this.discloud.bars.get("upload_bar");

    if (
      hasBar &&
      [
        "$(cloud-upload) Upload Discloud",
        "$(loading~spin) Upload Discloud",
        "$(loading~spin) Commiting Discloud"
      ].includes(`${hasBar?.text}`)
    ) {
      hasBar.text = "$(loading~spin) Commiting Discloud";
      hasBar.tooltip = "Commit to Discloud"
      hasBar.show();
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Commit",
        cancellable: true,
      },
      async (progress,) => {
        await vscode.commands.executeCommand("copyFilePath");
        const folders = await vscode.env.clipboard.readText();
        const paths = folders.split(/\r?\n/).filter(path => !regex.test(path));

        if (!folders) {
          progress.report({ increment: 100 });
          return vscode.window.showInformationMessage(
            "Nenhum arquivo foi encontrado."
          );
        }

        await progress.report({
          message: " Requisitando Aplicações...",
        });

        const userApps = await requester("/vscode", {
          headers: {
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

        const getApps = await userApps.user.appsStatus;
        let hasOtherName = false;
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
          progress.report({ increment: 100 });
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

        const savePath = resolve(targetPath, 'commit.zip');

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
          if (pth === savePath) {
            continue;
          }
          const base = pth.split(vscode.workspace.name).pop();
          statSync(pth).isDirectory()
            ? zip.directory(pth, base)
            : zip.file(pth, { name: base });
        }

        stream?.on("close", async () => {
          const form = new FormData();
          form.append("file", await streamtoBlob(savePath), "commit.zip");

          let finalID = "";

          const check =
            typeof hasOtherName !== "boolean"
              // @ts-ignore
              ? hasOtherName.filter((r) => r.name === input)
              : [];

          if (check.length > 0) {
            finalID = check[0].id;
          } else {
            finalID = input.split("|")[1].trim();
          }

          const data = await requester(`/app/${finalID}/commit`, {
            headers: {
              "api-token": `${token}`,
            },
            method: "PUT",
            body: form,
            headersTimeout: 420000,
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

        zip?.pipe(stream);
        zip?.finalize();
      }
    );
  };
};
