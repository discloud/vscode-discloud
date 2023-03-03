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
        title: t("progress.status.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickApp(task, true);
      if (!item.appId) throw Error(t("missing.appid"));
    }

    item = extension.appTree.children.get(item.appId)!;
    if (!item?.appId) throw Error(t("missing.appid"));

    if (!item.children.size)
      return extension.appTree.fetch();

    await extension.appTree.getStatus(item.appId);
  }
}
