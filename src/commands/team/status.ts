import { t } from "@vscode/l10n";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.status.title"),
      },
    });
  }

  async run(_: TaskData, item: TeamAppTreeItem) {
    await this.core.teamAppTree.getStatus(item.appId);
  }
}
