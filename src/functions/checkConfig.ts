import { readFileSync, existsSync } from "fs";
import * as vscode from 'vscode';

type KEYS = "ram" | "type" | "main" | "version";

export function check(path: string) {

    try {
        existsSync(path);
    } catch(err) {
        return null;
    }

    const file = readFileSync(path, { encoding: "utf8" });
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
    let isSite = { hasID: false };
    for(const item of splited) {
        if (Object(requiredScopes).keys().includes(item.toLowerCase())) {
            requiredScopes[item.toLowerCase() as KEYS] = true;
        }

        if (item === "TYPE=site") {
            splited.filter(r => r.includes("ID=")).length > 0 ? isSite.hasID = true : '';
        }
    }

    if (Object(requiredScopes).values().includes(false) || !isSite.hasID) {
        return vscode.window.showErrorMessage("Você não adicionou parâmetros obrigatórios no discloud.config!\nhttps://docs.discloudbot.com/suporte/faq/discloud.config");
    } 

    return true;
}