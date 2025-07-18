import { t } from "@vscode/l10n";
import { type RESTPutApiAppRamResult, Routes } from "discloud.app";
import { CancellationError, ProgressLocation } from "vscode";
import { AppType } from "../../@enum";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";
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

    const response = await this.core.api.put<RESTPutApiAppRamResult>(Routes.teamRam(item.appId), { body: { ramMB } });
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      await this.core.teamAppTree.fetch();
    }
  }
}
