import { t } from "@vscode/l10n";
import { env, window } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type UserTreeItem from "../../structures/UserTreeItem";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      allowTokenless: true,
    });
  }

  async run(_: TaskData, item: UserTreeItem) {
    await env.clipboard.writeText(item.userID);

    void window.showInformationMessage(t("copied.user.id"));
  }
}
