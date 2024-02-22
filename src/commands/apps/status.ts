import { t } from "@vscode/l10n";
import { ProgressLocation } from "vscode";
import extension from "../../extension";
import Command from "../../structures/Command";
import { TaskData } from "../../@types";
import AppTreeItem from "../../structures/AppTreeItem";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.status.title"),
      },
    });
  }

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    if (!item.children.size) {
      await extension.appTree.fetch();
      return;
    }

    await extension.appTree.getStatus(item.appId);
  }
}
