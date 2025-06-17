import { t } from "@vscode/l10n";
import { type RESTGetApiAppBackupResult, Routes } from "discloud.app";
import { existsSync } from "fs";
import { ProgressLocation, Uri, window, workspace } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import { ConfigKeys } from "../../util/constants";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.backup.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem) {
    const workspaceAvailable = extension.workspaceAvailable;
    let workspaceFolder: Uri | undefined;
    if (workspaceAvailable) workspaceFolder = await extension.getWorkspaceFolder();
    if (!workspaceFolder) {
      workspaceFolder = await extension.getFolderDialog(task);
      if (!workspaceFolder) throw Error(t("no.folder.found"));
    }

    const response = await extension.api.get<RESTGetApiAppBackupResult>(Routes.appBackup(item.appId));
    if (!response) return;

    if (!response.backups) throw Error(t("no.backup.found"));

    const backup = await fetch(response.backups.url);
    if (!backup.ok) throw Error(t("backup.request.failed"));

    const configBackupDir = extension.config.get<string>(ConfigKeys.appBackupDir) ?? "";
    const backupDirUri = workspaceAvailable ? Uri.joinPath(workspaceFolder, configBackupDir) : workspaceFolder;
    const backupZipUri = Uri.joinPath(backupDirUri, `${response.backups.id}.zip`);

    if (!existsSync(backupDirUri.fsPath))
      await workspace.fs.createDirectory(backupDirUri);

    await workspace.fs.writeFile(backupZipUri, Buffer.from(await backup.arrayBuffer()));

    window.showInformationMessage(t("backup.success", { dir: backupZipUri.fsPath }));
  }
}
