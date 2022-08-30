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
const zip_1 = require("../../functions/zip");
const fs_1 = require("fs");
const form_data_1 = __importDefault(require("form-data"));
const requester_1 = require("../../functions/requester");
module.exports = class extends command_1.Command {
    constructor(discloud) {
        super(discloud, {
            name: "commit",
        });
        this.run = async (uri) => {
            const token = this.discloud.config.get("token");
            await vscode.commands.executeCommand("copyFilePath");
            const folders = await vscode.env.clipboard.readText();
            const paths = folders.split("\n");
            if (!folders) {
                return vscode.window.showInformationMessage("Nenhum arquivo foi encontrado.");
            }
            const userApps = await (0, requester_1.requester)("get", "/user", {
                headers: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    "api-token": `${token}`
                }
            });
            const apps = await userApps.user.appsStatus.map(r => { return `${r.name} | ${r.id}`; });
            const input = await vscode.window.showQuickPick(apps, { canPickMany: false, title: "Escolha uma aplicação." });
            if (!input) {
                return vscode.window.showErrorMessage("Aplicação incorreta ou inexistente.");
            }
            let targetPath = "";
            const workspaceFolders = vscode.workspace.workspaceFolders || [];
            if (workspaceFolders && workspaceFolders.length) {
                targetPath = workspaceFolders[0].uri.fsPath;
            }
            else {
                vscode.window.showErrorMessage("Nenhum arquivo encontrado.");
                return;
            }
            const savePath = `${targetPath}\\commit.zip`;
            const { zip, stream } = new zip_1.Zip(savePath, "zip", {
                zlib: {
                    level: 9,
                },
            });
            if (!zip) {
                return vscode.window.showInformationMessage("Alguma Coisa com seu .zip deu errado.");
            }
            for await (const pth of paths) {
                const splitted = pth.replace('\r', '').split("\\");
                (0, fs_1.statSync)(paths[0][0].toLowerCase() + paths[0].slice(1, -1)).isDirectory() ?
                    zip.directory(pth, splitted[splitted.length - 1])
                    : zip.file(pth, { name: splitted[splitted.length - 1] });
            }
            stream?.on("close", async () => {
                const form = new form_data_1.default();
                form.append("commitFile", (0, fs_1.createReadStream)(savePath));
                const data = await (0, requester_1.requester)("put", `/app/${input}/commit`, {
                    headers: {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        "api-token": `${token}`,
                    },
                }, form);
                (0, fs_1.unlinkSync)(savePath);
                vscode.window.showInformationMessage(`${data?.message}`);
            });
            zip?.on("error", (err) => {
                vscode.window.showErrorMessage(JSON.stringify(err));
            });
            zip?.pipe(stream);
            zip?.finalize();
        };
    }
};
//# sourceMappingURL=commit.js.map