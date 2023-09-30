import { t } from "@vscode/l10n";
import { ModPermissions, RESTPostApiAppTeamResult, Routes } from "discloud.app";
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
    if (!modID) throw Error("Missing mod id");

    const permissions = Object.keys(ModPermissions).map(perm => <QuickPickItem>{
      label: t(`permission.${perm}`),
      description: perm,
    });

    const perms = await window.showQuickPick(permissions, {
      canPickMany: true,
    }).then(values => values?.map(value => value.description!));
    if (!perms) throw Error("Missing input");

    if (!await this.confirmAction())
      throw Error("Reject action");

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
