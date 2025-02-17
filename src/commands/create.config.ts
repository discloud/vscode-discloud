import { t } from "@vscode/l10n";
import { DiscloudConfig } from "discloud.app";
import { workspace } from "vscode";
import extension from "../extension";
import Command from "../structures/Command";

export default class extends Command {
  constructor() {
    super({
      allowTokenless: true,
    });
  }

  async run() {
    const workspaceFolder = await extension.getWorkspaceFolder();
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    const dConfig = new DiscloudConfig(workspaceFolder.fsPath);
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
      BUILD: "",
      START: "",
    }, [
      "# https://docs.discloudbot.com/discloud.config",
    ]);
  }
}
