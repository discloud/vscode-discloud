const { Command } = require("../../structures/command");

module.exports = class extends Command {
  constructor(discloud) {
    super(discloud, {
      name: "refreshButton",
    });
  }

  run = async () => {
    const tree = this.discloud.mainTree;
    tree ? await tree.refresh() : false;
  };
};