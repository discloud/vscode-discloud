import { type RESTPostApiAppTeamResult, Routes } from "@discloudapp/api-types/v2";
import { ModPermissionsBF } from "@discloudapp/util";
import { t } from "@vscode/l10n";
import { CancellationError, ProgressLocation, type QuickPickItem, window } from "vscode";
import { type TaskData } from "../../../@types";
import type ExtensionCore from "../../../core/extension";
import Command from "../../../structures/Command";
import type UserAppTreeItem from "../../../structures/UserAppTreeItem";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.mod.add.title"),
      },
    });
  }

  async run(_: TaskData, item: UserAppTreeItem) {
    const modID = await window.showInputBox({
      prompt: t("input.mod.add.prompt"),
    });
    if (!modID) throw Error(t("missing.moderator.id"));

    const permissions = ModPermissionsBF.All.toArray().map(perm => <QuickPickItem>{
      label: t(`permission.${perm}`),
      description: perm,
    });

    const perms = await window.showQuickPick(permissions, {
      canPickMany: true,
    }).then(values => values?.map(value => value.description!));
    if (!perms) throw Error(t("missing.input"));

    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await this.core.api.post<RESTPostApiAppTeamResult>(Routes.appTeam(item.appId), {
      body: {
        modID,
        perms,
      },
    });
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);
    }
  }
}
