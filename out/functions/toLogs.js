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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogs = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const vscode = __importStar(require("vscode"));
async function createLogs(message, logs, logName, options) {
    const msg = {
        withLink: () => { return vscode.window.showInformationMessage(message, "Abrir Logs", "Abrir Link"); },
        normal: () => { return vscode.window.showInformationMessage(message, "Abrir Logs"); },
        without: () => { return vscode.window.showInformationMessage(message); }
    };
    const ask = await msg[(options && options?.type ? options?.type : 'without')]();
    if (ask === "Abrir Logs") {
        let targetPath = "";
        const workspaceFolders = vscode.workspace.workspaceFolders || [];
        if (workspaceFolders && workspaceFolders.length) {
            targetPath = workspaceFolders[0].uri.fsPath;
        }
        else {
            vscode.window.showErrorMessage("Nenhum arquivo encontrado.");
            return;
        }
        (0, fs_1.writeFileSync)((0, path_1.join)(targetPath, `console.log`), logs.text);
        const fileToOpenUri = await vscode.Uri.file((0, path_1.join)(targetPath, `console.log`));
        return vscode.window.showTextDocument(fileToOpenUri, {
            viewColumn: vscode.ViewColumn.Beside,
        });
    }
    if (logs.link) {
        if (ask === "Abrir Link") {
            return vscode.env.openExternal(vscode.Uri.parse(`${logs.link}`));
        }
    }
}
exports.createLogs = createLogs;
//# sourceMappingURL=toLogs.js.map