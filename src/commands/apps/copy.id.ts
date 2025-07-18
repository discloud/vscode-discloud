import { t } from "@vscode/l10n";
import { env, window } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      allowTokenless: true,
    });
  }

  async run(_: TaskData, item: AppTreeItem) {
    await env.clipboard.writeText(item.appId);

    void window.showInformationMessage(t("copied.appid"));
  }
}
