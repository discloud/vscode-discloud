import { t } from "@vscode/l10n";
import { env, window } from "vscode";
import { TaskData } from "../../@types";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor() {
    super({
      noToken: true,
    });
  }

  async run(_: TaskData, item?: AppTreeItem | TeamAppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(null);
      item = picked.app;
      if (!item) throw Error(t("missing.appid"));
    }

    await env.clipboard.writeText(item.appId);

    window.showInformationMessage(t("copied.appid"));
  }
}
