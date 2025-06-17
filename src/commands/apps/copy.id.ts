import { t } from "@vscode/l10n";
import { env, window } from "vscode";
import { type TaskData } from "../../@types";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      allowTokenless: true,
    });
  }

  async run(_: TaskData, item: AppTreeItem) {
    await env.clipboard.writeText(item.appId);

    await window.showInformationMessage(t("copied.appid"));
  }
}
