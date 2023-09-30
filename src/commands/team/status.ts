import { t } from "@vscode/l10n";
import { ProgressLocation } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import Command from "../../structures/Command";
import TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.status.title"),
      },
    });
  }

  async run(task: TaskData, item?: TeamAppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false, startInTeamApps: true });
      item = picked.app;
    }

    item = extension.teamAppTree.children.get(item.appId)!;
    if (!item?.appId) throw Error(t("missing.appid"));

    if (!item.children.size)
      return extension.teamAppTree.fetch();

    await extension.teamAppTree.getStatus(item.appId);
  }
}
