import type ExtensionCore from "../core/extension";
import Command from "../structures/Command";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      allowTokenless: true,
    });
  }

  async run() {
    const session = await this.core.auth.pat.getSession();
    if (session) await this.core.auth.pat.removeSession(session.id);

    this.core.emit("missingToken");
  }
}
