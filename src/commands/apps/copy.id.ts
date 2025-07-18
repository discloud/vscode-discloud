import { t } from "@vscode/l10n";
import { env, window } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type UserAppTreeItem from "../../structures/UserAppTreeItem";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      allowTokenless: true,
    });
  }

  async run(_: TaskData, item: UserAppTreeItem) {
    await env.clipboard.writeText(item.appId);

    void window.showInformationMessage(t("copied.appid"));
  }
}
