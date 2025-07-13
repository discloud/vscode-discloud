import { t } from "@vscode/l10n";
import AdmZip from "adm-zip";
import { type RESTGetApiAppBackupResult, Routes } from "discloud.app";
import { existsSync } from "fs";
import { ProgressLocation, Uri, commands, window, workspace } from "vscode";
import { type TaskData } from "../../@types";
import core from "../../extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";
import { ConfigKeys } from "../../util/constants";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.import.title"),
      },
    });
  }

  async run(task: TaskData, item: AppTreeItem) {
    const workspaceAvailable = core.workspaceAvailable;
    let workspaceFolder: Uri | undefined;
    if (workspaceAvailable) workspaceFolder = await core.getWorkspaceFolder();
    if (!workspaceFolder) {
      workspaceFolder = await core.getFolderDialog(task);
      if (!workspaceFolder) throw Error(t("no.folder.found"));
    }

    const response = await core.api.get<RESTGetApiAppBackupResult>(Routes.appBackup(item.appId));
    if (!response) return;

    if (!response.backups) throw Error(t("no.backup.found"));

    const backup = await fetch(response.backups.url);
    if (!backup.body) throw Error(t("backup.request.failed"));

    const configImportDir = core.config.get<string>(ConfigKeys.appImportDir) ?? "";
    const importDirUri = workspaceAvailable ? Uri.joinPath(workspaceFolder, configImportDir) : workspaceFolder;
    const importUri = Uri.joinPath(importDirUri, response.backups.id);
    const importZipUri = Uri.joinPath(importDirUri, `${response.backups.id}.zip`);

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
