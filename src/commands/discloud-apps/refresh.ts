import { Command } from "../../structures/command";
import { Discloud } from "../../structures/extend";

module.exports = class extends Command {

    constructor(discloud: Discloud) {
        super(discloud, {
            name: "refreshButton"
        });
    }

    run = async () => {
        const tree = this.discloud.mainTree;
        tree ? await tree.refresh() : false;
    };
};
