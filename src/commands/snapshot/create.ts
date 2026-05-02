import { t } from "@vscode/l10n";
import { ProgressLocation, window } from "vscode";
import { type RESTPostApiSnapshotResult, type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type SnapshotAppTreeItem from "../../structures/SnapshotAppTreeItem";
import type UserAppTreeItem from "../../structures/UserAppTreeItem";

type Item = Pick<UserAppTreeItem, "appId"> | Pick<SnapshotAppTreeItem, "appId">

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.snapshot.create.title"),
      },
    });
  }

  async run(_: TaskData, item: Item) {
    const response = await this.core.api.post<RESTPostApiSnapshotResult>(`/snapshot/${item.appId}`);
    if (!response) return;

    void window.showInformationMessage(response.message ?? t("done"));

    await this.core.snapshotTree.refreshApp(item.appId);
  }
}
