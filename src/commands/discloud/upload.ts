import { Command } from "../../structures/command";
import * as vscode from "vscode";

import {
  statSync,
  accessSync,
  unlinkSync,
  createReadStream,
  readdirSync,
  WriteStream,
} from "fs";
import { requester } from "../../functions/requester";
import FormData from "form-data";
import { requiredFiles, blockedFiles } from "../../config.json";
import { check } from "../../functions/checkers/config";
import { Zip } from "../../functions/zip";
import { Discloud } from "../../structures/extend";
type LANGS = "js" | "py" | "rb" | "rs" | "ts" | "go";

export = class extends Command {
  constructor(discloud: Discloud) {
    super(discloud, {
      name: "upload",
    });
  }

  run = async (uri: vscode.Uri) => {
    const token = this.discloud.config.get("token") as string;
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

    const savePath = `${targetPath}/upload.zip`;
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

    if (isDirectory) {
      const files: string[] = readdirSync(targetPath);
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

      for (const file of files) {
        let lang = file.split(".")[1];
        if (lang) {
          if (
            requiredFiles[lang as LANGS] &&
            !requiredFiles[lang as LANGS]?.includes(file)
          ) {
            hasRequiredFiles.checks++;
            requiredFiles[lang as LANGS]?.length <= hasRequiredFiles.checks
              ? (hasRequiredFiles.all = true)
              : "";
          }

          if (
            blockedFiles[lang as LANGS] &&
            blockedFiles[lang as LANGS]?.includes(file)
          ) {
            continue;
          }
        }

        statSync(`${targetPath}\\${file}`).isDirectory()
          ? zip?.directory(`${targetPath}\\${file}`, file)
          : zip?.file(`${targetPath}\\${file}`, { name: file });
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
        form.append("upFile", createReadStream(savePath));

        const data = await requester(
          "post",
          "/upload",
          {
            headers: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              "api-token": `${token}`,
            },
          },
          form
        );
        vscode.window.showInformationMessage(`${data.message}`);
        upbar?.hide();
        unlinkSync(savePath);
      });

      zip?.on("error", (err) => {
        vscode.window.showErrorMessage(JSON.stringify(err));
      });

      zip?.pipe(stream as WriteStream);
      zip?.finalize();
    }
  };
};
