import extension from "../../../../extension";
import Command from "../../../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      noToken: true,
    });
  }

  async run() {
    const inspect = extension.config.inspect<number>("team.sort.online");

    const isGlobal = !inspect?.workspaceValue;

    extension.config.update("team.sort.online", true, isGlobal);
  }
}
