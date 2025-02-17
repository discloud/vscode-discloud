import { t } from "@vscode/l10n";
import * as AdmZip from "adm-zip";
import { type RESTGetApiAppBackupResult, Routes } from "discloud.app";
import { existsSync } from "fs";
import { ProgressLocation, Uri, commands, window, workspace } from "vscode";
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
    const workspaceAvailable = extension.workspaceAvailable;
    let workspaceFolder: Uri | undefined;
    if (workspaceAvailable) workspaceFolder = await extension.getWorkspaceFolder();
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

    const configImportDir = extension.config.get<string>("app.import.dir") ?? "";
    const importDirUri = workspaceAvailable ? Uri.joinPath(workspaceFolder, configImportDir) : workspaceFolder;
    const importUri = Uri.joinPath(importDirUri, res.backups.id);
    const importZipUri = Uri.joinPath(importDirUri, `${res.backups.id}.zip`);

    if (!existsSync(importDirUri.fsPath))
      await workspace.fs.createDirectory(importDirUri);

    await workspace.fs.writeFile(importZipUri, Buffer.from(await backup.arrayBuffer()));

    new AdmZip(importZipUri.fsPath).extractAllTo(importUri.fsPath, true);

    await workspace.fs.delete(importZipUri);

    queueMicrotask(async function () {
      const actionOk = t("open.dir");
      const action = await window.showInformationMessage(t("import.success"), actionOk);
      if (action === actionOk)
        commands.executeCommand("vscode.openFolder", importUri, { forceNewWindow: workspaceAvailable });
    });
  }
}
