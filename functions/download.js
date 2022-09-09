const vscode = require("vscode");
const { existsSync, mkdirSync, unlinkSync } = require("fs");
const AdmZip = require("adm-zip");
const { downloadFile } = require("./mkDownload");
const { join } = require("path");

async function download(url, uncompact, appName) {
  let targetPath = "";

  const workspaceFolders = vscode.workspace.workspaceFolders || [];

  if (workspaceFolders && workspaceFolders.length) {
    targetPath = workspaceFolders[0].uri.fsPath;
  } else {
    vscode.window.showErrorMessage("Você precisa abrir alguma pasta com o VSCode antes de realizar essa ação.");
    return;
  }

  if (!targetPath) {
    vscode.window.showErrorMessage("Alguma coisa deu errado com seu Zip.");
    return;
  }

  const path = uncompact == true ?  join(targetPath, 'discloud_backup', appName.replace(/([^A-Za-z])/g, '').replace(' ', '_')) : join(targetPath, 'discloud_backup')

  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }

  const file = await downloadFile(url, join(path, `${appName.replace(/([^A-Za-z])/g, '').replace(' ', '_')}.zip`))

  uncompact ? new AdmZip(file).extractAllTo(path) : '';
  uncompact ? unlinkSync(file) : false;

  return path;
};

module.exports = { download }