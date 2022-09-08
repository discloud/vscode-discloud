const { Command } = require("../../structures/command");
const vscode = require("vscode");

const { statSync, accessSync, unlinkSync, readdirSync } = require("fs");
const { requester } = require("../../functions/requester");
const { FormData } = require("undici");
const { requiredFiles, blockedFiles } = require("../../config.json");
const { check } = require("../../functions/checkers/config");
const { Zip } = require("../../functions/zip");
const { streamtoBlob } = require("../../functions/streamToBlob");
const { extname, join } = require("path");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "upload",
    });
  }

  run = async (uri) => {
    const token = this.discloud.config.get("token");

    if (!token) {
      return;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Upload",
        cancellable: true,
      },
      async (progress) => {
        const upbar = this.discloud.bars.get("upload_bar");
        upbar ? (upbar.text = "$(loading~spin) Uploading...") : false;

        let targetPath = "";
        if (uri && uri.fsPath) {
          targetPath = uri.fsPath;
        } else {
          const workspaceFolders = vscode.workspace.workspaceFolders || [];

          if (workspaceFolders && workspaceFolders.length) {
            targetPath = workspaceFolders[0].uri.fsPath;
          } else {
            vscode.window.showErrorMessage("Nenhum arquivo encontrado.");
            return;
          }
        }

        const isDirectory = statSync(targetPath).isDirectory();

        const savePath = `${targetPath}\\upload.zip`;
        let isExist = true;
        try {
          accessSync(savePath);
        } catch (error) {
          isExist = false;
        }

        let isGenerate = true;

        if (isExist && isGenerate) {
          unlinkSync(savePath);
        }

        const { zip, stream } = new Zip(savePath, "zip", {
          zlib: {
            level: 9,
          },
        });

        await progress.report({
          message: "Upload - Colocando Arquivos no Zip...",
          increment: 20,
        });

        if (isDirectory) {
          const files = readdirSync(targetPath);
          if (!files) {
            return;
          }

          if (!files.includes("discloud.config")) {
            return vscode.window.showErrorMessage(
              "Você precisa de um discloud.config para usar está função."
            );
          } else {
            const con = await check(targetPath + "\\discloud.config");
            if (!con) {
              return vscode.window.showErrorMessage(
                "Você precisa de um discloud.config válido para usar está função."
              );
            }
          }

          let hasRequiredFiles = { checks: 0, all: false };

          for await (const file of files) {
            if (file === "upload.zip") {
              continue;
            }
            let lang = extname(file);
            if (lang) {
              if (requiredFiles[lang] && !requiredFiles[lang]?.includes(file)) {
                hasRequiredFiles.checks++;
                requiredFiles[lang]?.length <= hasRequiredFiles.checks
                  ? (hasRequiredFiles.all = true)
                  : "";
              }

              if (blockedFiles[lang] && blockedFiles[lang]?.includes(file)) {
                continue;
              }
            }

            const path = join(targetPath, `${file}`)

            statSync(path).isDirectory()
              ? zip?.directory(path, file)
              : zip?.file(path, { name: file });
          }

          if (!hasRequiredFiles.all) {
            return vscode.window.showErrorMessage(
              `Para realizar um Upload, você precisa dos arquivos necessários para a hospedagem.\nCheque a documentação: https://docs.discloudbot.com/`
            );
          }
        }

        if (isGenerate) {
          stream?.on("close", async () => {
            const form = new FormData();
            form.append("file", await streamtoBlob(savePath), "upload.zip");

            await progress.report({
              message: "Upload - Requisitando Upload...",
              increment: 50,
            });

            const data = await requester("/upload", {
              headers: {
                "api-token": `${token}`,
              },
              method: "POST",
              body: form,
            });

            progress.report({ increment: 100 });
            if (data && data !== 222) {
              await upbar?.hide();
              vscode.window.showInformationMessage(`${data?.message}`);
              this.discloud.mainTree?.refresh();
            }
            await unlinkSync(savePath);
            if (data === 222) {
              await upbar?.hide();
            }
          });

          zip?.on("error", (err) => {
            vscode.window.showErrorMessage(JSON.stringify(err));
          });

          zip?.pipe(stream);
          zip?.finalize();
        }
      }
    );
  };
};
