import { DiscloudConfig } from "discloud.app";
import { workspace } from "vscode";
import extension from "../extension";
import Command from "../structures/Command";

export default class extends Command {
  constructor() {
    super({
      noToken: true,
    });
  }

  async run() {
    if (!extension.workspaceFolder) return;
    const workspaceFolder = extension.workspaceFolder;

    const dConfig = new DiscloudConfig(workspaceFolder);
    if (dConfig.exists) return;

    dConfig.update({
      ID: "",
      TYPE: "bot",
      MAIN: "",
      NAME: workspace.name,
      AVATAR: "",
      RAM: 100,
      AUTORESTART: false,
      VERSION: "latest",
      APT: "",
    }, [
      "# https://docs.discloudbot.com/discloud.config",
    ]);
  }
}