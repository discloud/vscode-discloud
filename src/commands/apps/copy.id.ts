import { t } from "@vscode/l10n";
import { env, window } from "vscode";
import { type TaskData } from "../../@types";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor() {
    super({
      allowTokenless: true,
    });
  }

  async run(_: TaskData, item?: AppTreeItem | TeamAppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(null);
      item = picked.app;
    }

    await env.clipboard.writeText(item.appId);

    window.showInformationMessage(t("copied.appid"));
  }
}
