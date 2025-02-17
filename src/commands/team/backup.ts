import { t } from "@vscode/l10n";
import { type RESTGetApiAppBackupResult, Routes } from "discloud.app";
import { existsSync } from "fs";
import { ProgressLocation, Uri, window, workspace } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import { requester } from "../../services/discloud";
import Command from "../../structures/Command";
import type TeamAppTreeItem from "../../structures/TeamAppTreeItem";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.backup.title"),
      },
    });
  }

  async run(task: TaskData, item?: TeamAppTreeItem) {
    const workspaceAvailable = extension.workspaceAvailable;
    let workspaceFolder: Uri | undefined;
    if (workspaceAvailable) workspaceFolder = await extension.getWorkspaceFolder();
    if (!workspaceFolder) {
      workspaceFolder = await extension.getFolderDialog(task);
      if (!workspaceFolder) throw Error(t("no.folder.found"));
    }

    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false, startInTeamApps: true });
      item = picked.app;
    }

    const res = await requester<RESTGetApiAppBackupResult>(Routes.teamBackup(item.appId));
    if (!res) return;

    if (!res.backups) throw Error(t("no.backup.found"));

    const backup = await fetch(res.backups.url);
    if (!backup.body) throw Error(t("backup.request.failed"));

    const configBackupDir = extension.config.get<string>("app.backup.dir") ?? "";
    const backupDirUri = workspaceAvailable ? Uri.joinPath(workspaceFolder, configBackupDir) : workspaceFolder;
    const backupZipUri = Uri.joinPath(backupDirUri, `${res.backups.id}.zip`);

    if (!existsSync(backupDirUri.fsPath))
      await workspace.fs.createDirectory(backupDirUri);

    await workspace.fs.writeFile(backupZipUri, Buffer.from(await backup.arrayBuffer()));

    window.showInformationMessage(t("backup.success", { dir: backupZipUri.fsPath }));
  }
}
