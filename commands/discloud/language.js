const { Command } = require("../../structures/command");
const vscode = require("vscode");

module.exports = class extends Command {
    constructor(discloud) {
        super(discloud, {
            name: "language",
        });
    }

    run = async () => {
        const input = await vscode.window.showQuickPick(this.discloud.textsSystem.languages, {
            canPickMany: false,
            title: this.discloud.textsSystem.getText({ folder: 'commands', text: 'language.selectLang', language: this.discloud.language }),
        });

        if (!input) {
            vscode.window.showErrorMessage(this.discloud.textsSystem.getText({ folder: 'commands', text: 'language.mandatory', language: this.discloud.language }));
            return;
        }

        vscode.workspace.getConfiguration("discloud").update("language", input, true);
        this.discloud.language = input;
        vscode.window.showInformationMessage(this.discloud.textsSystem.getText({ folder: 'commands', text: 'language.success', language: this.discloud.language, variables: { lang: input } }));
    };
};
