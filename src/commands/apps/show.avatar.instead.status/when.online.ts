import extension from "../../../extension";
import Command from "../../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      allowTokenless: true,
    });
  }

  async run() {
    const inspect = extension.config.inspect<number>("app.show.avatar.instead.status");

    const isGlobal = !inspect?.workspaceValue;

    extension.config.update("app.show.avatar.instead.status", "when.online", isGlobal);
  }
}
