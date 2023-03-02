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
        title: t("progress.import.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!extension.workspaceFolder) return;
    const workspaceFolder = extension.workspaceFolder;

    if (!item.appId) {
      item.appId = await this.pickApp(task, true);
      if (!item.appId) return;
    }

    const res = await requester<RESTGetApiAppBackupResult>(Routes.appBackup(item.appId));
    if (!res.backups) return;

    const backup = await fetch(res.backups.url);
    if (!backup.body) return;

    const configImportDir = extension.config.get<string>("app.import.dir");
    const importDir = join(workspaceFolder, configImportDir!);
    const importFolderPath = join(importDir, res.backups.id).replace(/\\/g, "/");
    const importFilePath = `${importFolderPath}.zip`;

    if (!existsSync(importDir))
      mkdirSync(importDir, { recursive: true });

    await writeFile(importFilePath, backup.body, "utf8");

    new AdmZip(importFilePath).extractAllTo(join(importDir, res.backups.id));
    unlinkSync(importFilePath);

    (async () => {
      const actionOk = t("open.dir");
      const action = await window.showInformationMessage(t("import.success"), actionOk);
      if (action === actionOk)
        commands.executeCommand("vscode.openFolder", Uri.file(importFolderPath), {
          forceNewWindow: true,
        });
    })();
  }
}