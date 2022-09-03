"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const command_1 = require("../../structures/command");
const vscode = __importStar(require("vscode"));
const fs_1 = require("fs");
const requester_1 = require("../../functions/requester");
const form_data_1 = __importDefault(require("form-data"));
const config_json_1 = require("../../config.json");
const config_1 = require("../../functions/checkers/config");
const zip_1 = require("../../functions/zip");
module.exports = class extends command_1.Command {
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
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Upload",
            cancellable: true,
        }, async (progress, tk) => {
            const upbar = this.discloud.bars.get("upload_bar");
            upbar ? (upbar.text = "$(loading~spin) Uploading...") : false;
            let targetPath = "";
            if (uri && uri.fsPath) {
                targetPath = uri.fsPath;
            }
            else {
                const workspaceFolders = vscode.workspace.workspaceFolders || [];
                if (workspaceFolders && workspaceFolders.length) {
                    targetPath = workspaceFolders[0].uri.fsPath;
                }
                else {
                    vscode.window.showErrorMessage("Nenhum arquivo encontrado.");
                    return;
                }
            }
            const isDirectory = (0, fs_1.statSync)(targetPath).isDirectory();
            const savePath = `${targetPath}/upload.zip`;
            let isExist = true;
            try {
                (0, fs_1.accessSync)(savePath);
            }
            catch (error) {
                isExist = false;
            }
            let isGenerate = true;
            if (isExist && isGenerate) {
                (0, fs_1.unlinkSync)(savePath);
            }
            const { zip, stream } = new zip_1.Zip(savePath, "zip", {
                zlib: {
                    level: 9,
                },
            });
            await progress.report({ message: "Upload - Colocando Arquivos no Zip...",
                increment: 20,
            });
            if (isDirectory) {
                const files = (0, fs_1.readdirSync)(targetPath);
                if (!files) {
                    return;
                }
                if (!files.includes("discloud.config")) {
                    return vscode.window.showErrorMessage("Você precisa de um discloud.config para usar está função.");
                }
                else {
                    const con = await (0, config_1.check)(targetPath + "\\discloud.config");
                    if (!con) {
                        return vscode.window.showErrorMessage("Você precisa de um discloud.config válido para usar está função.");
                    }
                }
                let hasRequiredFiles = { checks: 0, all: false };
                for await (const file of files) {
                    let lang = file.split(".")[1];
                    if (lang) {
                        if (config_json_1.requiredFiles[lang] &&
                            !config_json_1.requiredFiles[lang]?.includes(file)) {
                            hasRequiredFiles.checks++;
                            config_json_1.requiredFiles[lang]?.length <= hasRequiredFiles.checks
                                ? (hasRequiredFiles.all = true)
                                : "";
                        }
                        if (config_json_1.blockedFiles[lang] &&
                            config_json_1.blockedFiles[lang]?.includes(file)) {
                            continue;
                        }
                    }
                    (0, fs_1.statSync)(`${targetPath}\\${file}`).isDirectory()
                        ? zip?.directory(`${targetPath}\\${file}`, file)
                        : zip?.file(`${targetPath}\\${file}`, { name: file });
                }
                if (!hasRequiredFiles.all) {
                    return vscode.window.showErrorMessage(`Para realizar um Upload, você precisa dos arquivos necessários para a hospedagem.\nCheque a documentação: https://docs.discloudbot.com/`);
                }
            }
            if (isGenerate) {
                stream?.on("close", async () => {
                    const form = new form_data_1.default();
                    form.append("upFile", (0, fs_1.createReadStream)(savePath));
                    await progress.report({ message: "Upload - Requisitando Upload...",
                        increment: 50,
                    });
                    const data = await (0, requester_1.requester)("/upload", {
                        headers: {
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            "api-token": `${token}`,
                        },
                        method: "POST",
                        body: form
                    });
                    progress.report({ increment: 100 });
                    if (data && data !== 222) {
                        await upbar?.hide();
                        vscode.window.showInformationMessage(`${data?.message}`);
                        this.discloud.mainTree?.refresh();
                    }
                    await (0, fs_1.unlinkSync)(savePath);
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
        });
    };
};
//# sourceMappingURL=upload.js.map