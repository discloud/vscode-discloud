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
const requester_1 = require("../../functions/requester");
const command_1 = require("../../structures/command");
const vscode = __importStar(require("vscode"));
const download_1 = require("../../functions/download");
module.exports = class extends command_1.Command {
    constructor(discloud) {
        super(discloud, {
            name: "importCode",
        });
    }
    run = async (item) => {
        const token = this.discloud.config.get("token");
        if (!token) {
            return;
        }
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Importar Aplicação",
        }, async (progress, tk) => {
            const backup = await (0, requester_1.requester)(`/app/${item.tooltip}/backup`, {
                headers: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    "api-token": token,
                },
                method: "GET"
            });
            if (backup) {
                progress.report({ message: "Importar Aplicação - Backup da Aplicação recebido.", increment: 20 });
            }
            if (backup?.backups?.url) {
                progress.report({ message: "Importar Aplicação - Baixando Backup da Aplicação recebido.", increment: 40 });
                const downloadFile = await (0, download_1.download)(`${backup.backups.url}`);
                if (!downloadFile) {
                    return;
                }
                progress.report({ message: "Importar Aplicação - Backup Baixado com sucesso! Descompactando...", increment: 60 });
                const folderPathParsed = downloadFile.split(`\\`).join(`/`);
                const folderUri = vscode.Uri.file(folderPathParsed);
                await progress.report({ message: "Importar Aplicação - Descompactado com sucesso!", increment: 100 });
                const ask = await vscode.window.showInformationMessage(`Arquivo Criado com Sucesso`, `Abrir o Diretório`);
                if (ask === "Abrir o Diretório") {
                    return vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
                }
            }
            else {
                return vscode.window.showErrorMessage(`Ocorreu algum erro durante o Backup de sua Aplicação. Tente novamente mais tarde.`);
            }
        });
    };
};
//# sourceMappingURL=backup.js.map