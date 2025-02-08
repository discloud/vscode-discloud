import { t } from "@vscode/l10n";
import * as AdmZip from "adm-zip";
import { type RESTGetApiAppBackupResult, Routes } from "discloud.app";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import { ProgressLocation, Uri, commands, window } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import { requester } from "../../services/discloud";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.import.title"),
      },
    });
  }

  async run(task: TaskData, item?: AppTreeItem) {
    let workspaceFolder = extension.workspaceFolder;
    if (!workspaceFolder) {
      workspaceFolder = await extension.getFolderDialog(task);
      if (!workspaceFolder) throw Error(t("no.folder.found"));
    }

    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const res = await requester<RESTGetApiAppBackupResult>(Routes.appBackup(item.appId));
    if (!res) return;

    if (!res.backups) throw Error(t("no.backup.found"));

    const backup = await fetch(res.backups.url);
    if (!backup.body) throw Error(t("backup.request.failed"));

    const configImportDir = extension.config.get<string>("app.import.dir");
    const importDir = extension.workspaceAvailable ? join(workspaceFolder, configImportDir!) : workspaceFolder;
    const importFolderPath = join(importDir, res.backups.id);
    const importFilePath = `${importFolderPath}.zip`;

    if (!existsSync(importDir))
      mkdirSync(importDir, { recursive: true });

    await writeFile(importFilePath, backup.body, "utf8");

    new AdmZip(importFilePath)
      .extractAllTo(extension.workspaceAvailable ? importFolderPath : importDir, true);
    unlinkSync(importFilePath);

    (async () => {
      const actionOk = t("open.dir");
      const action = await window.showInformationMessage(t("import.success"), actionOk);
      if (action === actionOk)
        commands.executeCommand("vscode.openFolder", Uri.file(extension.workspaceAvailable ? importFolderPath : importDir), {
          forceNewWindow: extension.workspaceAvailable,
        });
    })();
  }
}
