import { t } from "@vscode/l10n";
import { ProgressLocation } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.status.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      task.progress.report({ message: t("choose.app") });

      item.appId = await this.pickApp();

      if (!item.appId) return;
    }

    item = extension.appTree.children.get(item.appId);
    if (!item?.appId) return;

    if (!item.children.size)
      return extension.appTree.fetch();

    await extension.appTree.getStatus(item.appId);
  }
}
