import { t } from "@vscode/l10n";
import { ProgressLocation } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.status.title"),
      },
    });
  }

  async run(_: TaskData, item: AppTreeItem) {
    await this.core.appTree.getStatus(item.appId);
  }
}
