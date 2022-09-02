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
        await (0, login_1.login)();
    };
};
//# sourceMappingURL=logIn.js.map