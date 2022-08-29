import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";
import { TreeItem } from "../../functions/api/tree";
import { requester } from "../../functions/requester";
import * as vscode from 'vscode';

export = class extends Command {

    constructor(discloud: Discloud) {
        super(discloud, {
            name: "startEntry"
        });
    }

    run = async (item: TreeItem) => {

        const token = this.discloud.config.get("token") as string;
        if (!token) {
            return;
        }
        const tree = this.discloud.mainTree;
        
        const start = await requester('put', `/app/${item.tooltip}/start`, {
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "api-token": token
            }
        }, {});

        vscode.window.showInformationMessage(`${start.message}`);
        setTimeout(() => {tree ? tree.refresh() : false;}, 10000);
    };
};
