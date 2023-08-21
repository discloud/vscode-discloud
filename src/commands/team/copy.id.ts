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
      const picked = await this.pickAppOrTeamApp(null, { startInTeamApps: true });
      item.appId = picked.id;

      if (!item.appId)
        return window.showWarningMessage(t("missing.team.appid"));
    }


    await env.clipboard.writeText(item.appId);

    window.showInformationMessage(t("copied.team.appid"));
  }
}
