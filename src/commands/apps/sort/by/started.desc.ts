import extension from "../../../../extension";
import Command from "../../../../structures/Command";

const configKey = "app.sort.by";

export default class extends Command {
  constructor() {
    super({
      allowTokenless: true,
    });
  }

  async run() {
    const inspect = extension.config.inspect<number>(configKey);

    const isGlobal = !inspect?.workspaceValue;

    extension.config.update(configKey, "started.desc", isGlobal);
  }
}
