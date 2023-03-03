import { t } from "@vscode/l10n";
import { env, window } from "vscode";
import { TaskData } from "../../@types";
import Command from "../../structures/Command";
import TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor() {
    super({
      noToken: true,
    });
  }

  async run(_: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickTeamApp(null, true);

      if (!item.appId)
        return window.showWarningMessage(t("missing.team.appid"));
    }


    await env.clipboard.writeText(item.appId);

    window.showInformationMessage(t("copied.team.appid"));
  }
}