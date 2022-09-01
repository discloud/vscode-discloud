"use strict";
const command_1 = require("../../structures/command");
module.exports = class extends command_1.Command {
    constructor(discloud) {
        super(discloud, {
            name: "refreshButton"
        });
    }
    run = async () => {
        const tree = this.discloud.mainTree;
        tree ? await tree.refresh() : false;
    };
};
//# sourceMappingURL=refresh.js.map