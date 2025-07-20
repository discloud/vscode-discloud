import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core);
  }

  async run() {
    await this.core.teamAppTree.fetch();
  }
}
