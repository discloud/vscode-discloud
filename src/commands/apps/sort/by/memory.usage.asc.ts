import extension from "../../../../extension";
import Command from "../../../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      allowTokenless: true,
    });
  }

  async run() {
    const inspect = extension.config.inspect<number>("app.sort.by");

    const isGlobal = !inspect?.workspaceValue;

    extension.config.update("app.sort.by", "memory.usage.asc", isGlobal);
  }
}
