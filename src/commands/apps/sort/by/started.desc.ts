import extension from "../../../../extension";
import Command from "../../../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      noToken: true,
    });
  }

  async run() {
    const inspect = extension.config.inspect<number>("app.sort.by");

    const isGlobal = !inspect?.workspaceValue;

    extension.config.update("app.sort.by", "started.desc", isGlobal);
  }
}
