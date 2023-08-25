import { t } from "@vscode/l10n";
import { RESTGetApiAppBackupResult, Routes } from "discloud.app";
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetch } from "undici";
import { ProgressLocation, window } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import Command from "../../structures/Command";
import TeamAppTreeItem from "../../structures/TeamAppTreeItem";
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

  async run(task: TaskData, item: TeamAppTreeItem = <TeamAppTreeItem>{}) {
    let workspaceFolder = extension.workspaceFolder;
    if (!workspaceFolder) {
      workspaceFolder = await extension.getFolderDialog(task);
      if (!workspaceFolder) throw Error("No workspace folder found");
    }

    if (!item.appId) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false, startInTeamApps: true });
      item.appId = picked.id;
      if (!item.appId) throw Error(t("missing.appid"));
    }

    const res = await requester<RESTGetApiAppBackupResult>(Routes.teamBackup(item.appId));
    if (!res.backups) throw Error("No backup found");

    const backup = await fetch(res.backups.url);
    if (!backup.body) throw Error("Fail to request backup");

    const configBackupDir = extension.config.get<string>("team.backup.dir");
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
