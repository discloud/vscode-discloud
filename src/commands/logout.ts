import type ExtensionCore from "../core/extension";
import Command from "../structures/Command";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      allowTokenless: true,
    });
  }

  async run() {
    if (!await this.core.secrets.getToken()) return;

    await this.core.secrets.setToken();

    this.core.emit("missingToken");
  }
}