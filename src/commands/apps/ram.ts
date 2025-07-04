import { t } from "@vscode/l10n";
import { type RESTPutApiAppRamResult, Routes } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { AppType } from "../../@enum";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
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

  async run(_: TaskData, item: AppTreeItem) {
    const min = item.type === AppType.site ? 512 : 100;
    const max = extension.user.totalRamMb - (extension.user.ramUsedMb - item.data.ram);

    const ramMB = await InputBox.getInt({
      denyInitial: item.data.ram >= min || item.data.ram <= max,
      initial: item.data.ram,
      max,
      min,
      prompt: t("input.ram.prompt"),
      required: true,
    });

    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await extension.api.put<RESTPutApiAppRamResult>(Routes.appRam(item.appId), { body: { ramMB } });
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await extension.appTree.fetch();
    }
  }
}
