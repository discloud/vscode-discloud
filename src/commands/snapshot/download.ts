import { t } from "@vscode/l10n";
import { env, ProgressLocation, Uri } from "vscode";
import { type RESTGetApiSnapshotDownloadResult, type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type SnapshotVersionTreeItem from "../../structures/SnapshotVersionTreeItem";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.snapshot.download.title"),
      },
    });
  }

  async run(_: TaskData, itemOrAppId: SnapshotVersionTreeItem | string, maybeVersion?: string) {
    const appId = typeof itemOrAppId === "string" ? itemOrAppId : itemOrAppId.appId;
    const version = typeof itemOrAppId === "string" ? maybeVersion : itemOrAppId.version;

    if (!version) throw Error(t("missing.snapshot.version"));

    const response = await this.core.api.get<RESTGetApiSnapshotDownloadResult>(`/snapshot/${appId}/versions/${version}`);
    if (!response?.download?.url) return;

    await env.openExternal(Uri.parse(response.download.url));
  }
}
