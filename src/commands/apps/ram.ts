import { t } from "@vscode/l10n";
import { type RESTPutApiAppRamResult, Routes } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { AppType } from "../../@enum";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import core from "../../extension";
import Command from "../../structures/Command";
import type UserAppTreeItem from "../../structures/UserAppTreeItem";
import InputBox from "../../utils/Input";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.ram.title"),
      },
    });
  }

  async run(_: TaskData, item: UserAppTreeItem) {
    const min = item.type === AppType.site ? 512 : 100;
    const max = this.core.user.totalRamMb - (core.user.ramUsedMb - item.data.ram);

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

    const response = await this.core.api.put<RESTPutApiAppRamResult>(Routes.appRam(item.appId), { body: { ramMB } });
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await this.core.userAppTree.fetch();
    }
  }
}
