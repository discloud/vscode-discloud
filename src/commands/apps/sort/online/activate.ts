import extension from "../../../../extension";
import Command from "../../../../structures/Command";

const configKey = "app.sort.online";

export default class extends Command {
  constructor() {
    super({
      allowTokenless: true,
    });
  }

  async run() {
    const inspect = extension.config.inspect<number>(configKey);

    const isGlobal = !inspect?.workspaceValue;

    extension.config.update(configKey, true, isGlobal);
  }
}
