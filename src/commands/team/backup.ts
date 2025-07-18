import { t } from "@vscode/l10n";
import { type RESTGetApiAppBackupResult, Routes } from "discloud.app";
import { existsSync } from "fs";
import { ProgressLocation, Uri, window, workspace } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";
import { ConfigKeys } from "../../utils/constants";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.backup.title"),
      },
    });
  }

  async run(task: TaskData, item: TeamAppTreeItem) {
    const workspaceAvailable = this.core.workspaceAvailable;
    let workspaceFolder: Uri | undefined;
    if (workspaceAvailable) workspaceFolder = await this.core.getWorkspaceFolder();
    if (!workspaceFolder) {
      workspaceFolder = await this.core.getFolderDialog(task);
      if (!workspaceFolder) throw Error(t("no.folder.found"));
    }

    const response = await this.core.api.get<RESTGetApiAppBackupResult>(Routes.teamBackup(item.appId));
    if (!response) return;

    if (!response.backups) throw Error(t("no.backup.found"));

    const backup = await fetch(response.backups.url);
    if (!backup.body) throw Error(t("backup.request.failed"));

    const configBackupDir = this.core.config.get<string>(ConfigKeys.teamBackupDir) ?? "";
    const backupDirUri = workspaceAvailable ? Uri.joinPath(workspaceFolder, configBackupDir) : workspaceFolder;
    const backupZipUri = Uri.joinPath(backupDirUri, `${response.backups.id}.zip`);

    if (!existsSync(backupDirUri.fsPath))
      await workspace.fs.createDirectory(backupDirUri);

    await workspace.fs.writeFile(backupZipUri, Buffer.from(await backup.arrayBuffer()));

    void window.showInformationMessage(t("backup.success", { dir: backupZipUri.fsPath }));
  }
}
