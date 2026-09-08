import type { TaskData } from "../../../@types";
import type ExtensionCore from "../../../core/extension";
import { localize } from "../../../localize";
import Command from "../../../structures/Command";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      allowTokenless: true,
    });
  }

  async run(_: TaskData) {
    await localize(this.core.context);
  }
}
