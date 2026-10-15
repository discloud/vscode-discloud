import type ExtensionCore from "../../core";
import Command from "../../structures/Command";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core);
  }

  async run() {
    await this.core.userAppTree.fetch();
  }
}
