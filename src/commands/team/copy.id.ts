import { t } from "@vscode/l10n";
import { env, ProgressLocation, window } from "vscode";
import { TaskData } from "../../@types";
import Command from "../../structures/Command";
import TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.copy.id.title"),
      },
    });
  }

  async run(task: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickTeamApp(task);
    }

    if (!item.appId)
      return window.showWarningMessage(t("missing.team.appid"));

    await env.clipboard.writeText(item.appId);

    window.showInformationMessage(t("copied.team.appid"));
  }
}