import { t } from "@vscode/l10n";
import { window } from "vscode";
import extension from "../../extension";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super();
  }

  async run() {
    if (extension.autoRefresher.interval) {
      window.showWarningMessage(t("command.declined.auto.refresh.is.activated"));
    } else {
      await extension.appTree.fetch();
    }
  }
}
