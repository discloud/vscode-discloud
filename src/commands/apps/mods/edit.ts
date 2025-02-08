import { t } from "@vscode/l10n";
import { ModPermissionsFlags, type RESTPutApiAppTeamResult, Routes } from "discloud.app";
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
        title: t("progress.mod.edit.title"),
      },
    });
  }

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const mod = await this.pickAppMod(item.appId, task);
    if (!mod) throw Error("Missing mod");

    const permissions = Object.keys(ModPermissionsFlags).map(perm => <QuickPickItem>{
      label: t(`permission.${perm}`),
      description: perm,
      picked: mod.perms.has(perm),
    });

    const perms = await window.showQuickPick(permissions, {
      canPickMany: true,
    }).then(values => values?.map(value => value.description!));
    if (!perms) throw Error("Missing input");

    if (!await this.confirmAction())
      throw Error("Reject action");

    const res = await requester<RESTPutApiAppTeamResult>(Routes.appTeam(item.appId), {
      body: JSON.stringify({
        modID: mod.id,
        perms,
      }),
      method: "PUT",
    });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);
    }
  }
}
