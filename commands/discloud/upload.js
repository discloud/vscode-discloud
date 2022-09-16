const { Command } = require("../../structures/command");
const vscode = require("vscode");

const { statSync, accessSync, unlinkSync, existsSync, readdirSync, createReadStream } = require("node:fs");
const { join } = require("node:path");
const { FormData } = require("undici");
const { requiredFiles, blockedFullFiles } = require("../../config.json");
const { check } = require("../../functions/checkers/config");
const { RecursivelyReadDirSync } = require("../../functions/RecursivelyReadDirSync");
const { requester } = require("../../functions/requester");
const { streamtoBlob } = require("../../functions/streamToBlob");
const { Zip } = require("../../functions/zip");

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

        targetPath = targetPath.replace(/\\/g, "/")

        let verifyConfig = await check(join(targetPath, "discloud.config"));
        if (verifyConfig === undefined) {
          progress.report({ increment: 100 })
          upbar?.dispose()
          return this.discloud.loadStatusBar()
        }

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

        await progress.report({
          message: "Upload - Colocando Arquivos no Zip...",
          increment: 20,
        });

        const { found } = new RecursivelyReadDirSync(targetPath, {
          ignore: blockedFullFiles.concat("**.zip"),
          ignoreFile: join(targetPath, ".discloudignore")
        })

        const discloudConfigPath = join(targetPath, "discloud.config")

        if (existsSync(discloudConfigPath)) {
          const con = await check(discloudConfigPath);
          if (!con) {
            progress.report({ increment: 100 })
            upbar?.dispose()
            this.discloud.loadStatusBar()
            return vscode.window.showErrorMessage(
              "Você precisa de um discloud.config válido para usar está função."
            );
          }
        } else {
          progress.report({ increment: 100 })
          return vscode.window.showErrorMessage(
            "Você precisa de um discloud.config para usar está função."
          );
        }

        const config = await check(discloudConfigPath, true);

        if (!existsSync(join(targetPath, config.MAIN))) {
          progress.report({ increment: 100 })
          upbar?.dispose()
          this.discloud.loadStatusBar()
          return vscode.window.showErrorMessage(
            `O arquivo ${config.MAIN} especificado não existe.\nCheque a documentação: https://docs.discloudbot.com/suporte/faq/discloud.config`
          );
        }

        const verifyDir = readdirSync(join(targetPath))
        const fileExt = config.MAIN.split(".").pop()
        if (requiredFiles[fileExt] && requiredFiles[fileExt].some(f => !verifyDir.includes(f))) {
          progress.report({ increment: 100 })
          upbar?.dispose()
          this.discloud.loadStatusBar()
          return vscode.window.showErrorMessage(
            `Para realizar um Upload, você precisa dos arquivos necessários para a hospedagem.\nCheque a documentação: https://docs.discloudbot.com/suporte/linguagens`
          );
        }

        const { zip, stream } = new Zip(savePath, "zip", {
          zlib: {
            level: 9,
          },
        });

        zip?.pipe(stream);

        for await (const file of found) {
          const filename = file.replace(targetPath, "")

          if (statSync(file).isFile())
            zip?.append(createReadStream(file), { name: filename });
        }

        await zip?.finalize();

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
              await upbar?.hide();
              return this.discloud.mainTree?.refresh();
            }

            if (data.statusCode === 504 && data.status === "error") {
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
        }
      }
    );
  };
};
