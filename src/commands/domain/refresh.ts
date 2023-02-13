import extension from "../../extension";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super();
  }

  async run() {
    await extension.appTree.fetch();
  }
}
