import core from "../extension";
import Command from "../structures/Command";

export default class extends Command {
  constructor() {
    super({
      allowTokenless: true,
    });
  }

  async run() {
    if (!await core.secrets.getToken()) return;

    await core.secrets.setToken();

    core.emit("missingToken");
  }
}