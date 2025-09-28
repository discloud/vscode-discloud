import { DiscloudConfig } from "@discloudapp/util";
import { t } from "@vscode/l10n";
import { Uri, workspace } from "vscode";
import type ExtensionCore from "../core/extension";
import WarningError from "../errors/warning";
import Command from "../structures/Command";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      allowTokenless: true,
    });
  }

  async run() {
    const workspaceFolder = await this.core.getWorkspaceFolder({ silent: true });
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    const findConfig = await workspace.findFiles(DiscloudConfig.filename);

    if (findConfig.length) throw new WarningError(t("file.already.exists"));

    const content = [
      "# https://docs.discloud.com/en/discloud.config",
      "ID=",
      "MAIN=",
      `NAME=${workspace.name}`,
    ].join("\n");

    await workspace.fs.writeFile(Uri.joinPath(workspaceFolder, DiscloudConfig.filename), Buffer.from(content, "utf8"));
  }
}
