import { t } from "@vscode/l10n";
import * as AdmZip from "adm-zip";
import { RESTGetApiAppBackupResult, Routes } from "discloud.app";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetch } from "undici";
import { ProgressLocation, Uri, commands, window } from "vscode";
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
        title: t("progress.import.title"),
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

    const configImportDir = extension.config.get<string>("team.import.dir");
    const importDir = extension.workspaceAvailable ? join(workspaceFolder, configImportDir!) : workspaceFolder;
    const importFolderPath = join(importDir, res.backups.id);
    const importFilePath = `${importFolderPath}.zip`;

    if (!existsSync(importDir))
      mkdirSync(importDir, { recursive: true });

    await writeFile(importFilePath, backup.body, "utf8");

    new AdmZip(importFilePath)
      .extractAllTo(extension.workspaceAvailable ? join(importDir, res.backups.id) : importDir);
    unlinkSync(importFilePath);

    (async () => {
      const actionOk = t("open.dir");
      const action = await window.showInformationMessage(t("import.success"), actionOk);
      if (action === actionOk)
        commands.executeCommand("vscode.openFolder", Uri.file(importFolderPath), {
          forceNewWindow: extension.workspaceAvailable,
        });
    })();
  }
}
