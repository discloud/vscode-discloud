import { t } from "@vscode/l10n";
import { ProgressLocation } from "vscode";
import extension from "../../extension";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.status.title"),
      },
    });
  }

  async run() {
    if (extension.appTree.children.size)
      await extension.appTree.getStatus();
  }
}
