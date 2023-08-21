import { t } from "@vscode/l10n";
import { ModPermissions, RESTPutApiAppTeamResult, Routes } from "discloud.app";
import { ProgressLocation, QuickPickItem, window } from "vscode";
import { TaskData } from "../../../@types";
import AppTreeItem from "../../../structures/AppTreeItem";
import Command from "../../../structures/Command";
import { requester } from "../../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.mod.edit.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item.appId = picked.id;
      if (!item.appId) throw Error(t("missing.appid"));
    }

    const mod = await this.pickAppMod(item.appId, task);
    if (!mod) throw Error("Missing mod");

    const permissions = Object.keys(ModPermissions).map(perm => <QuickPickItem>{
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

    if ("status" in res) {
      this.showApiMessage(res);
    }
  }
}
