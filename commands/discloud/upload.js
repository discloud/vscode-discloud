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
const fs = require("fs");

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

        let verifyConfig = await check(join(targetPath, "discloud.config"));
        if(verifyConfig === undefined) {
          progress.report({ increment: 100 })
          upbar?.dispose()
          return this.discloud.loadStatusBar()
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

          try {
            fs.readFileSync(join(targetPath, config.MAIN));
          } catch (error) {
            progress.report({ increment: 100 })
            upbar?.dispose()
            this.discloud.loadStatusBar()
            return vscode.window.showErrorMessage(
              `O arquivo ${config.MAIN} especificado não existe.\nCheque a documentação: https://docs.discloudbot.com/suporte/faq/discloud.config`
            );
          }
          const verifyDir = fs.readdirSync(join(targetPath))
          if (requiredFiles[config.MAIN.split(".").pop()] && requiredFiles[config.MAIN.split(".").pop()].some(f => !verifyDir.includes(f))){
            progress.report({ increment: 100 })
            upbar?.dispose()
            this.discloud.loadStatusBar()
            return vscode.window.showErrorMessage(
              `Para realizar um Upload, você precisa dos arquivos necessários para a hospedagem.\nCheque a documentação: https://docs.discloudbot.com/suporte/linguagens`
            );
          }

          let discloudIgnore = verifyDir.includes('.discloudignore') ? fs.readFileSync(join(targetPath, `.discloudignore`), "utf8") : ''
          let discloudIgnoreArray = verifyDir.includes('.discloudignore') ? discloudIgnore.split("\n") : []

          for await (const file of files) {
            if (file.endsWith('.zip') ) {
              continue;
            }

            if (blockedFullFiles.includes(file)) {
              continue;
            }

            if (discloudIgnoreArray.includes(file)) {
              continue;
            }

            const path = join(targetPath, `${file}`)

            const filename = file.split(/\\|\//).pop()

            statSync(path).isDirectory()
              ? zip?.directory(path, filename)
              : zip?.file(path, { name: filename });
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

            unlinkSync(savePath);

            if (data && data.status !== 'error') {
              await upbar?.hide();
              vscode.window.showInformationMessage(`${data?.message} - ID: ${data.app.id}`);
              return this.discloud.mainTree?.refresh();
            }

            if (data.statusCode === 222 && data.status === "error") {
              console.log("aqui!")
              await upbar?.hide();
              return this.discloud.mainTree?.refresh();
            }
            
            if (data.statusCode === 504 && data.status === "error") {
              console.log("aqui")
              //await upbar?.hide();
              progress.report({ increment: 100 })
              upbar?.dispose()
              return this.discloud.loadStatusBar()
            }
            if (data && data.status == 'error') {
              vscode.window.showInformationMessage(`${data?.message}`);
              progress.report({ increment: 100 })
              upbar?.dispose()
              return this.discloud.loadStatusBar()
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
