import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
import * as vscode from 'vscode';

export = class extends Command {

    constructor(discloud: Discloud) {
        super(discloud, {
            name: "deleteEntry"
        });
    }

    run = async (item: TreeItem) => {
        const token = this.discloud.config.get("token") as string;
        if (!token) {
            return;
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Deletar Aplicação"
        }, async (progress, tk) => {

            await requester('del', `/app/${item.tooltip}/delete`, {
                headers: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    "api-token": token
                }
            });
    
            progress.report({ increment: 100 });
            vscode.window.showInformationMessage(`Deletar Aplicação - Aplicação ${item.label} deletada com sucesso!`);
            const tree = this.discloud.mainTree;
            return tree ? await tree.refresh(tree?.data.filter(r => r.label !== item.label)) : false;
        });
    
    };
};
