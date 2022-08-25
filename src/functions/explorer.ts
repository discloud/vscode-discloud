import archiver from 'archiver';
import { statSync, accessSync, unlinkSync, createWriteStream, createReadStream, readdirSync } from 'fs';
import { parse } from 'path';
import * as vscode from 'vscode';
import { requester } from './requester';
import FormData from 'form-data';
import { requiredFiles, blockedFiles } from '../config.json';
import { check } from './checkConfig';
type LANGS = "js" | "py" | "rb" | "rs" | "ts" | "go";

export async function upload (uri: vscode.Uri, token: string) {

    let targetPath = '';
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

    const pathParse = parse(targetPath);
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

    const output = createWriteStream(savePath);
    const archive = archiver("zip", {
        zlib: {
            level: 9
        },
    });

    if (isDirectory) {
        
        const files: string[] = readdirSync(targetPath);
        if (!files) { return; };

        if (!files.includes("discloud.config")) {
            return vscode.window.showErrorMessage("Você precisa de um discloud.config para usar está função.");
        } else {
            const con = await check(targetPath+"\\discloud.config");
            if (!con) {
                return vscode.window.showErrorMessage("Você precisa de um discloud.config válido para usar está função.");
            }
        }

        let hasRequiredFiles = { checks: 0, all: false };

        for (const file of files) {
            let lang = file.split('.')[1];
            if (lang) {
                if (requiredFiles[(lang as LANGS)] && !requiredFiles[(lang as LANGS)]?.includes(file)) {
                    hasRequiredFiles.checks++;
                    requiredFiles[(lang as LANGS)]?.length <= hasRequiredFiles.checks ? hasRequiredFiles.all = true : '';
                }

                if (blockedFiles[(lang as LANGS)] && blockedFiles[(lang as LANGS)]?.includes(file)) {
                    continue;
                }
            }
            
            statSync(`${targetPath}\\${file}`).isDirectory() ? archive.directory(`${targetPath}\\${file}`, false) : archive.file(`${targetPath}\\${file}`, { name: file });
        }

        if (!hasRequiredFiles.all) {
            return vscode.window.showErrorMessage(`Para realizar um upload, você precisa dos arquivos necessários para a hospedagem.\nCheque a documentação: https://docs.discloudbot.com/`);
        }
    }

    if (isGenerate) {
        
        output.on('close', async () => {

            const form = new FormData();
            form.append('upFile', createReadStream(savePath));
            
            const data = await requester('post', '/upload', {
                headers: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    "api-token": `${token}`
                }
            }, form);
            vscode.window.showInformationMessage(`${data}`);
            unlinkSync(savePath);
        });

        archive.on('error', err => {
            vscode.window.showErrorMessage(JSON.stringify(err));
        });

        archive.pipe(output);
        archive.finalize();
    }
}