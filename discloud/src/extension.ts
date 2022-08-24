import * as vscode from 'vscode';
import { DiscloudAPI } from 'discloud-api';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('dc.commit', () => {
		commit(context);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}


function commit(context: vscode.ExtensionContext) {

	const config = vscode.workspace.getConfiguration('dc');

	config.get('')
}