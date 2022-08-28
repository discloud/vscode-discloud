import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";

export = class extends Command {

    constructor(discloud: Discloud) {
        super(discloud, {
            name: "refresh"
        });
    }

    run = async () => {
        const tree = this.discloud.trees.get('apps_tree');
        tree ? tree.refresh() : false;
    };
};
