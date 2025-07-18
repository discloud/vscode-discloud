import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super();
  }

  async run() {
    await this.core.userAppTree.fetch();
  }
}
