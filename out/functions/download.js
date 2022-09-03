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
Object.defineProperty(exports, "__esModule", { value: true });
exports.download = void 0;
const vscode = __importStar(require("vscode"));
const download_1 = __importDefault(require("download"));
const fs_1 = require("fs");
async function download(url, uncompact = false) {
    let targetPath = "";
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    if (workspaceFolders && workspaceFolders.length) {
        targetPath = workspaceFolders[0].uri.fsPath;
    }
    else {
        vscode.window.showErrorMessage("Nenhum arquivo encontrado.");
        return;
    }
    if (!targetPath) {
        vscode.window.showErrorMessage("Alguma coisa deu errado com seu Zip.");
        return;
    }
    if (!(0, fs_1.existsSync)(targetPath + "\\backup")) {
        (0, fs_1.mkdirSync)(targetPath + "\\backup");
    }
    uncompact ? await (0, download_1.default)(url, targetPath + "\\backup", { extract: true }) : await (0, download_1.default)(url, targetPath + "\\backup");
    return targetPath + "\\backup";
}
exports.download = download;
//# sourceMappingURL=download.js.map