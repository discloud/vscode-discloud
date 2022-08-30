import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
import * as vscode from 'vscode';

export = class extends Command {

    constructor(discloud: Discloud) {
        super(discloud, {
            name: "ramEntry"
        });
    }

    run = async (item: TreeItem) => {
        const token = this.discloud.config.get("token") as string;
        if (!token) {
            return;
        }
        const tree = this.discloud.mainTree;

        const toPut = await vscode.window.showInputBox({ title: "Coloque a nova quantidade de RAM que o app irá usar." });
        
        const ram = await requester('put', `/app/${item.tooltip}/ram`, {
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "api-token": token
            }
        }, {
            ramMB: parseInt(`${toPut}`)
        });

        if (!ram) { return; }
        vscode.window.showInformationMessage(`${ram.message}`);
        setTimeout(() => {tree ? tree.refresh() : false;}, 10000);
    };
};
