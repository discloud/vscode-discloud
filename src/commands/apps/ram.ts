import { t } from "@vscode/l10n";
import { type RESTPutApiAppRamResult, Routes } from "discloud.app";
import { ProgressLocation } from "vscode";
import { AppType } from "../../@enum";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import { requester } from "../../services/discloud";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import { InputBox } from "../../util/Input";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.ram.title"),
      },
    });
  }

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const min = item.type === AppType.site ? 512 : 100;
    const max = extension.user.totalRamMb - (extension.user.ramUsedMb - item.data.ram);

    const ramMB = await InputBox.getInt({
      initial: item.data.ram,
      denyInitial: item.data.ram > max,
      max,
      min,
      prompt: t("input.ram.prompt"),
    });

    if (ramMB === undefined) throw Error(t("missing.input"));

    if (!await this.confirmAction())
      throw Error(t("rejected.action"));

    const res = await requester<RESTPutApiAppRamResult>(Routes.appRam(item.appId), {
      body: JSON.stringify({ ramMB }),
      method: "PUT",
    });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      await extension.appTree.fetch();
    }
  }
}
