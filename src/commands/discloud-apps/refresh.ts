import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";

export = class extends Command {

    constructor(discloud: Discloud) {
        super(discloud, {
            name: "refreshButton"
        });
    }

    run = async () => {
        const tree = this.discloud.mainTree;
        tree ? tree.refresh() : false;
    };
};
