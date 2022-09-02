"use strict";
const command_1 = require("../../structures/command");
const login_1 = require("../../functions/login");
module.exports = class extends command_1.Command {
    constructor(discloud) {
        super(discloud, {
            name: "logIn",
        });
    }
    run = async () => {
        const tree = this.discloud.mainTree;
        await (0, login_1.login)(tree);
    };
};
//# sourceMappingURL=logIn.js.map