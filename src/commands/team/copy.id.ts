import { t } from "@vscode/l10n";
import { env, window } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      allowTokenless: true,
    });
  }

  async run(_: TaskData, item: TeamAppTreeItem) {
    await env.clipboard.writeText(item.appId);

    void window.showInformationMessage(t("copied.team.appid"));
  }
}
