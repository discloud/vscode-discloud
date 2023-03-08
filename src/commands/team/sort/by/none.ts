import extension from "../../../../extension";
import Command from "../../../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      noToken: true,
    });
  }

  async run() {
    const inspect = extension.config.inspect<number>("team.sort.by");

    const isGlobal = !inspect?.workspaceValue;

    extension.config.update("team.sort.by", "none", isGlobal);
  }
}
