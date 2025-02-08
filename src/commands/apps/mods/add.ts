import { t } from "@vscode/l10n";
import { ModPermissionsFlags, type RESTPostApiAppTeamResult, Routes } from "discloud.app";
import { ProgressLocation, type QuickPickItem, window } from "vscode";
import { type TaskData } from "../../../@types";
import { requester } from "../../../services/discloud";
import type AppTreeItem from "../../../structures/AppTreeItem";
import Command from "../../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.mod.add.title"),
      },
    });
  }

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const modID = await window.showInputBox({
      prompt: t("input.mod.add.prompt"),
    });
    if (!modID) throw Error(t("missing.moderator.id"));

    const permissions = Object.keys(ModPermissionsFlags).map(perm => <QuickPickItem>{
      label: t(`permission.${perm}`),
      description: perm,
    });

    const perms = await window.showQuickPick(permissions, {
      canPickMany: true,
    }).then(values => values?.map(value => value.description!));
    if (!perms) throw Error(t("missing.input"));

    if (!await this.confirmAction())
      throw Error(t("rejected.action"));

    const res = await requester<RESTPostApiAppTeamResult>(Routes.appTeam(item.appId), {
      body: JSON.stringify({
        modID,
        perms,
      }),
      method: "POST",
    });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);
    }
  }
}
