import extension from "../../../../extension";
import Command from "../../../../structures/Command";
import { ConfigKeys } from "../../../../util/constants";

export default class extends Command {
  constructor() {
    super({
      allowTokenless: true,
    });
  }

  async run() {
    const configKey = ConfigKeys.teamSortBy;

    const inspect = extension.config.inspect<number>(configKey);

    const isGlobal = !inspect?.workspaceValue;

    extension.config.update(configKey, "name.asc", isGlobal);
  }
}
