import { t } from "@vscode/l10n";
import { type RESTGetApiAppBackupResult, Routes } from "discloud.app";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import { ProgressLocation, window } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import { requester } from "../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.backup.title"),
      },
    });
  }

  async run(task: TaskData, item?: AppTreeItem) {
    let workspaceFolder = extension.workspaceFolder;
    if (!workspaceFolder) {
      workspaceFolder = await extension.getFolderDialog(task);
      if (!workspaceFolder) throw Error("No folder found");
    }

    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const res = await requester<RESTGetApiAppBackupResult>(Routes.appBackup(item.appId));
    if (!res) return;

    if (!res.backups) throw Error("No backup found");

    const backup = await fetch(res.backups.url);
    if (!backup.body) throw Error("Fail to request backup");

    const configBackupDir = extension.config.get<string>("app.backup.dir");
    const backupDir = extension.workspaceAvailable ? join(workspaceFolder, configBackupDir!) : workspaceFolder;
    const backupFolderPath = join(backupDir, res.backups.id);
    const backupFilePath = `${backupFolderPath}.zip`;

    if (!existsSync(backupDir))
      mkdirSync(backupDir, { recursive: true });

    await writeFile(backupFilePath, backup.body, "utf8");

    window.showInformationMessage(t("backup.success", {
      dir: join(`${configBackupDir}`, `${res.backups.id}.zip`),
    }));
  }
}
