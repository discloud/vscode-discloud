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
exports.check = void 0;
const fs_1 = require("fs");
const vscode = __importStar(require("vscode"));
function check(path) {
    try {
        (0, fs_1.existsSync)(path);
    }
    catch (err) {
        return null;
    }
    const file = (0, fs_1.readFileSync)(path, { encoding: "utf8" });
    if (!file) {
        return vscode.window.showErrorMessage(`Você não pode usar esta função com um discloud.config inválido.\nCheque a Documentação para Dúvidas: https://docs.discloudbot.com/suporte/faq/discloud.config`);
    }
    const splited = file.split('\n').filter(r => r.includes("="));
    let requiredScopes = {
        ram: false,
        type: false,
        main: false,
        version: false
    };
    let isSite = { hasID: false, site: false };
    for (const item of splited) {
        if (Object.keys(requiredScopes).includes(item.split('=')[0].toLowerCase())) {
            requiredScopes[item.split('=')[0].toLowerCase()] = true;
        }
        if (item === "TYPE=site") {
            isSite.site = true;
            splited.filter(r => r.includes("ID=")).length > 0 ? isSite.hasID = true : '';
        }
    }
    if (Object.values(requiredScopes).includes(false) || (!isSite.hasID && isSite.site)) {
        return vscode.window.showErrorMessage("Você não adicionou parâmetros obrigatórios no discloud.config!\nhttps://docs.discloudbot.com/suporte/faq/discloud.config");
    }
    return true;
}
exports.check = check;
//# sourceMappingURL=config.js.map