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
        const tree = this.discloud.mainTree;
        const token = this.discloud.config.get("token") as string;
        
        await requester('del', `/app/${item.tooltip}/delete`, {
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "api-token": token
            }
        });

        // const appOnTree = tree?.data.filter(r => r.id !== item.id) as TreeItem[];
        // tree ? tree.data = appOnTree : false;
        tree?.refresh();
        vscode.window.showInformationMessage(`Aplicação ${item.label} deletada com sucesso!`);
    };
};
