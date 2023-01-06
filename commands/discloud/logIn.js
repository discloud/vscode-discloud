const { Command } = require("../../structures/command");
const { login } = require("../../functions/login");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "logIn",
    });
  }

  run = async () => {
    await login(this.discloud);
  };
};
