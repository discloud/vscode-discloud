import type ExtensionCore from "../../../../core/extension";
import Command from "../../../../structures/Command";
import { ConfigKeys } from "../../../../utils/constants";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      allowTokenless: true,
    });
  }

  async run() {
    const configKey = ConfigKeys.teamSortOnline;

    const inspect = this.core.config.inspect<number>(configKey);

    const isGlobal = !inspect?.workspaceValue;

    this.core.config.update(configKey, false, isGlobal);
  }
}
