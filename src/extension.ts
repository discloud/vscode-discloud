import * as vscode from 'vscode';
import { Explorer } from './functions/explorer';

import {AppTreeDataProvider} from './functions/appsList';

let uploadBar: vscode.StatusBarItem;

export async function activate({ subscriptions }: vscode.ExtensionContext) {

	const token = await checkIfHasToken();
	uploadBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 40);
	uploadBar.command = "discloud.upload";
	uploadBar.text = "$(cloud-upload) Upload to Discloud";
	subscriptions.push(uploadBar);
	uploadBar.show();
		
	const apps = new AppTreeDataProvider();
    vscode.window.registerTreeDataProvider("discloud-apps", apps);

	let disposable = vscode.commands.registerCommand(`discloud.upload`, async (uri: vscode.Uri) => {
		if (!token) { 
			await checkIfHasToken();
		} else {
			uploadBar.text = "$(loading) Upload to Discloud";
			new Explorer().upload(uri, token);
			uploadBar.hide();
		}
	});
	

	subscriptions.push(disposable);
}

export function deactivate() { }

export async function checkIfHasToken() {

	const token = vscode.workspace.getConfiguration('discloud').get('token') as string;
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

const functions = {

	commit: (context: vscode.ExtensionContext) => {
		vscode.window.showInformationMessage("aqui");
	},
	delete: (context: vscode.ExtensionContext) => { },
	start: (context: vscode.ExtensionContext) => { },
	stop: (context: vscode.ExtensionContext) => { },
	restart: (context: vscode.ExtensionContext) => { },
	logs: (context: vscode.ExtensionContext) => { },
	backup: (context: vscode.ExtensionContext) => { },
	ram: (context: vscode.ExtensionContext) => { },
};