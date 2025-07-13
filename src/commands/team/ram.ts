import { t } from "@vscode/l10n";
import { type RESTPutApiAppRamResult, Routes } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { AppType } from "../../@enum";
import { type TaskData } from "../../@types";
import core from "../../extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";
import InputBox from "../../util/Input";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.ram.title"),
      },
    });
  }

  async run(_: TaskData, item: TeamAppTreeItem) {
    const min = item.type === AppType.site ? 512 : 100;

    const ramMB = await InputBox.getInt({
      denyInitial: typeof item.data.ram === "number" && item.data.ram >= min,
      initial: item.data.ram,
      min,
      prompt: t("input.ram.prompt"),
      required: true,
    });

    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await core.api.put<RESTPutApiAppRamResult>(Routes.teamRam(item.appId), { body: { ramMB } });
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await core.teamAppTree.fetch();
    }
  }
}
