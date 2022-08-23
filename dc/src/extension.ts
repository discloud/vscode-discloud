import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "dc" is now active!');

	let disposable = vscode.commands.registerCommand('dc.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Discloud Commiter!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
