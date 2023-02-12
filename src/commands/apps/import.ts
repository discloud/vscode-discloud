import { t } from "@vscode/l10n";
import * as AdmZip from "adm-zip";
import { RESTGetApiAppBackupResult, Routes } from "discloud.app";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetch } from "undici";
import { commands, ProgressLocation, Uri, window } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
import AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import { requester } from "../../util";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: t("progress.import.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!extension.workspaceFolder) return;
    const workspaceFolder = extension.workspaceFolder;

    if (!item.appId) {
      task.progress.report({ message: t("choose.app") });

      item.appId = await this.pickApp();

      if (!item.appId) return;
    }

    const res = await requester<RESTGetApiAppBackupResult>(Routes.appBackup(item.appId));
    if (!res.backups) return;

    const backup = await fetch(res.backups.url);
    if (!backup.body) return;

    const backupDir = join(workspaceFolder, "discloud", "backup");
    const backupFolderPath = join(backupDir, res.backups.id).replace(/\\/g, "/");
    const backupFilePath = `${backupFolderPath}.zip`;

    if (!existsSync(backupDir))
      mkdirSync(backupDir, { recursive: true });

    await writeFile(backupFilePath, backup.body, "utf8");

    new AdmZip(backupFilePath).extractAllTo(join(backupDir, res.backups.id));
    unlinkSync(backupFilePath);

    const actionOk = t("open.dir");
    const action = await window.showInformationMessage(t("import.success"), actionOk);
    if (action === actionOk)
      commands.executeCommand("vscode.openFolder", Uri.file(backupFolderPath), {
        forceNewWindow: true,
      });
  }
}