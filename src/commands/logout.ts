import type ExtensionCore from "../core/extension";
import Command from "../structures/Command";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      allowTokenless: true,
    });
  }

  async run() {
    if (!await this.core.auth.pat.getSession()) return;

    await this.core.auth.pat.removeSession();

    this.core.emit("missingToken");
  }
}