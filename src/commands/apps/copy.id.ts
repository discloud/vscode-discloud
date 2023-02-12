import { t } from "@vscode/l10n";
import { env, ProgressLocation, window } from "vscode";
import { TaskData } from "../../@types";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.copy.id.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      task.progress.report({ message: t("choose.app") });

      item.appId = await this.pickApp();
    }

    if (!item.appId)
      return window.showWarningMessage(t("missing.appid"));

    await env.clipboard.writeText(item.appId);

    window.showInformationMessage(t("copied.appid"));
  }
}