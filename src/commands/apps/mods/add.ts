import { t } from "@vscode/l10n";
import { ModPermissions, RESTPostApiAppTeamResult, Routes } from "discloud.app";
import { ProgressLocation, window } from "vscode";
import { TaskData } from "../../../@types";
import AppTreeItem from "../../../structures/AppTreeItem";
import Command from "../../../structures/Command";
import { requester } from "../../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.mod.add.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      item.appId = await this.pickApp(task, true);
      if (!item.appId) return;
    }

    const modID = await window.showInputBox({
      prompt: t("input.mod.add.prompt"),
    });
    if (!modID) return;

    const permissions = Object.keys(ModPermissions)
      .map(perm => `${t(`permission.${perm}`)} - ${perm}`);

    const perms = await window.showQuickPick(permissions, {
      canPickMany: true,
    }).then(values => values?.map(value => value.split(" - ").pop()!) ?? []);

    if (!await this.confirmAction()) return;

    const res = await requester<RESTPostApiAppTeamResult>(Routes.appTeam(item.appId), {
      body: JSON.stringify({
        modID,
        perms,
      }),
      method: "POST",
    });

    if ("status" in res) {
      if (res.status === "ok") {
        window.showInformationMessage(`${res.status}: ${res.message} - ID: ${item.appId}`);
      } else {
        window.showWarningMessage(`${res.status}: ${res?.message}`);
      }
    }
  }
}
