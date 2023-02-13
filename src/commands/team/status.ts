import { t } from "@vscode/l10n";
import { RESTGetApiAppStatusResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import Command from "../../structures/Command";
import TeamAppTreeItem from "../../structures/TeamAppTreeItem";
import { requester } from "../../util";

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

  async run(task: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    if (!item.appId) {
      task.progress.report({ message: t("choose.app") });

      item.appId = await this.pickTeamApp();

      if (!item.appId) return;
    }

    item = extension.teamAppTree.children.get(item.appId);
    if (!item?.appId) return;

    if (!item.children.size)
      return extension.teamAppTree.fetch();

    const res = await requester<RESTGetApiAppStatusResult>(Routes.teamStatus(item.appId));
    if (!res.apps) return;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    item._patch(res.apps);
  }
}
