import core from "../../../../extension";
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

    const inspect = core.config.inspect<number>(configKey);

    const isGlobal = !inspect?.workspaceValue;

    core.config.update(configKey, "id.desc", isGlobal);
  }
}
