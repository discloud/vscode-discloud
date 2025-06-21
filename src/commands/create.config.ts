import { t } from "@vscode/l10n";
import { DiscloudConfig } from "discloud.app";
import { Uri, workspace } from "vscode";
import WarningError from "../errors/warning";
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

    const findConfig = await workspace.findFiles(DiscloudConfig.filename);

    if (findConfig.length) throw new WarningError(t("file.already.exists"));

    const content = [
      "# https://docs.discloudbot.com/discloud.config",
      "ID=",
      "TYPE=bot",
      "MAIN=",
      `NAME=${workspace.name}`,
      "RAM=100",
    ].join("\n");

    await workspace.fs.writeFile(Uri.joinPath(workspaceFolder, DiscloudConfig.filename), Buffer.from(content, "utf8"));
  }
}
