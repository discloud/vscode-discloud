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
exports.checkIfHasToken = exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const explorer_1 = require("./functions/explorer");
let uploadBar;
async function activate({ subscriptions }) {
    const token = await checkIfHasToken();
    uploadBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 40);
    uploadBar.command = "discloud.upload";
    uploadBar.text = "$(cloud-upload) Upload to Discloud";
    subscriptions.push(uploadBar);
    uploadBar.show();
    let disposable = vscode.commands.registerCommand(`discloud.upload`, async (uri) => {
        if (!token) {
            await checkIfHasToken();
        }
        else {
            uploadBar.text = "$(loading) Upload to Discloud";
            functions.upload(uri, token);
            uploadBar.hide();
        }
    });
    subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
async function checkIfHasToken() {
    const token = vscode.workspace.getConfiguration('discloud').get('token');
    if (!token || token.length < 0) {
        const ask = await vscode.window.showWarningMessage("Você não tem um Token configurado. Deseja configurar um?", {}, "Sim", "Não");
        if (ask === "Sim") {
            const input = await vscode.window.showInputBox({ prompt: "API TOKEN", title: "Coloque seu Token da API da Discloud aqui." });
            if (!input) {
                return vscode.window.showErrorMessage("Token inválido.");
            }
            vscode.workspace.getConfiguration('discloud').update('token', input);
            vscode.window.showInformationMessage("Token configurado com sucesso!");
        }
    }
    return token;
}
exports.checkIfHasToken = checkIfHasToken;
const functions = {
    commit: (context) => {
        vscode.window.showInformationMessage("aqui");
    },
    upload: explorer_1.upload,
    delete: (context) => { },
    start: (context) => { },
    stop: (context) => { },
    restart: (context) => { },
    logs: (context) => { },
    backup: (context) => { },
    ram: (context) => { },
};
//# sourceMappingURL=extension.js.map