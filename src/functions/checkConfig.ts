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
    let isSite = { hasID: false, site: false };
    for(const item of splited) {
        if (Object.keys(requiredScopes).includes(item.split('=')[0].toLowerCase())) {
            requiredScopes[item.split('=')[0].toLowerCase() as KEYS] = true;
        }

        console.log(item);

        if (item === "TYPE=site") {
            isSite.site = true;
            splited.filter(r => r.includes("ID=")).length > 0 ? isSite.hasID = true : '';
        }
    }

    console.log(requiredScopes);

    if (Object.values(requiredScopes).includes(false) || (!isSite.hasID && isSite.site)) {
        return vscode.window.showErrorMessage("Você não adicionou parâmetros obrigatórios no discloud.config!\nhttps://docs.discloudbot.com/suporte/faq/discloud.config");
    } 

    return true;
}