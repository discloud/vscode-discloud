import { type RESTDeleteApiAppTeamResult, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { CancellationError, ProgressLocation } from "vscode";
import { type TaskData } from "../../../@types";
import type ExtensionCore from "../../../core/extension";
import Command from "../../../structures/Command";
import type UserAppTreeItem from "../../../structures/UserAppTreeItem";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.mod.rem.title"),
      },
    });
  }

  async run(task: TaskData, item: UserAppTreeItem) {
    const mod = await this.pickAppMod(item.appId, task);
    if (!mod) throw Error(t("missing.moderator"));

    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await this.core.api.delete<RESTDeleteApiAppTeamResult>(Routes.appTeam(item.appId, mod.id));
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);
    }
  }
}
