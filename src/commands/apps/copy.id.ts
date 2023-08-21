import { t } from "@vscode/l10n";
import { env, window } from "vscode";
import { TaskData } from "../../@types";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      noToken: true,
    });
  }

  async run(_: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      const picked = await this.pickAppOrTeamApp(null);
      item.appId = picked.id;

      if (!item.appId)
        return window.showWarningMessage(t("missing.appid"));
    }

    await env.clipboard.writeText(item.appId);

    window.showInformationMessage(t("copied.appid"));
  }
}
