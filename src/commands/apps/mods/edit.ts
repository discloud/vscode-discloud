import { t } from "@vscode/l10n";
import { ModPermissionsBF, type RESTPutApiAppTeamResult, Routes } from "discloud.app";
import { CancellationError, ProgressLocation, type QuickPickItem, window } from "vscode";
import { type TaskData } from "../../../@types";
import extension from "../../../extension";
import type AppTreeItem from "../../../structures/AppTreeItem";
import Command from "../../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.mod.edit.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem) {
    const mod = await this.pickAppMod(item.appId, task);
    if (!mod) throw Error(t("missing.moderator"));

    const permissions = ModPermissionsBF.All.toArray().map(perm => <QuickPickItem>{
      label: t(`permission.${perm}`),
      description: perm,
      picked: mod.perms.has(perm),
    });

    const perms = await window.showQuickPick(permissions, {
      canPickMany: true,
    }).then(values => values?.map(value => value.description!));
    if (!perms) throw Error(t("missing.input"));

    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await extension.api.put<RESTPutApiAppTeamResult>(Routes.appTeam(item.appId), {
      body: {
        modID: mod.id,
        perms,
      },
    });
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);
    }
  }
}
