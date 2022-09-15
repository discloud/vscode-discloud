const { Command } = require("../../structures/command");
const vscode = require("vscode");

const { statSync, accessSync, unlinkSync, readdirSync } = require("fs");
const { requester } = require("../../functions/requester");
const { FormData } = require("undici");
const { requiredFiles, blockedFullFiles } = require("../../config.json");
const { check } = require("../../functions/checkers/config");
const { Zip } = require("../../functions/zip");
const { streamtoBlob } = require("../../functions/streamToBlob");
const { join } = require("path");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "upload",
    });
  }

  /**
   * @param {vscode.Uri} uri 
   */
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

        const savePath = join(`${targetPath}`, `upload.zip`);
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
            progress.report({ increment: 100 })
            return vscode.window.showErrorMessage(
              "Você precisa de um discloud.config para usar está função."
            );
          } else {
            const con = await check(join(targetPath, "discloud.config"));
            if (!con) {
              progress.report({ increment: 100 })
              upbar?.dispose()
              this.discloud.loadStatusBar()
              return vscode.window.showErrorMessage(
                "Você precisa de um discloud.config válido para usar está função."
              );
            }
          }

          const config = await check(join(targetPath, "discloud.config"), true);

          let hasRequiredFiles = { checks: 0, all: false };

          for await (const file of files) {
            if (file.endsWith('.zip') ) {
              continue;
            }
            const lang = config.MAIN.split(".").pop();
            
            if (lang) {
              if (requiredFiles[lang] && !requiredFiles[lang]?.includes(file)) {
                hasRequiredFiles.checks++;
                requiredFiles[lang]?.length <= hasRequiredFiles.checks
                  ? (hasRequiredFiles.all = true)
                  : "";
              }
            }
            if (blockedFullFiles.includes(file)) {
              continue;
            }

            const path = join(targetPath, `${file}`)

            const filename = file.split(/\\|\//).pop()

            statSync(path).isDirectory()
              ? zip?.directory(path, filename)
              : zip?.file(path, { name: filename });
          }

          if (!hasRequiredFiles.all) {
            progress.report({ increment: 100 })
            upbar?.dispose()
            this.discloud.loadStatusBar()
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
              headersTimeout: 420000,
            });


            progress.report({ increment: 100 });
            if (data && data !== 222) {
              await upbar?.hide();
              vscode.window.showInformationMessage(`${data?.message} - ID: ${data.app.id}`);
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
          await zip?.finalize();
        }
      }
    );
  };
};
