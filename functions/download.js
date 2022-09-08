const vscode = require("vscode");
const { existsSync, mkdirSync, unlinkSync } = require("fs");
const AdmZip = require("adm-zip");
const { downloadFile } = require("./mkDownload");
const { join } = require("path");

async function download(url, uncompact) {
  let targetPath = "";

  const workspaceFolders = vscode.workspace.workspaceFolders || [];

  if (workspaceFolders && workspaceFolders.length) {
    targetPath = workspaceFolders[0].uri.fsPath;
  } else {
    vscode.window.showErrorMessage("Nenhum arquivo encontrado.");
    return;
  }

  if (!targetPath) {
    vscode.window.showErrorMessage("Alguma coisa deu errado com seu Zip.");
    return;
  }

  const path = join(targetPath, `backup`)

  if (!existsSync(path)) {
    mkdirSync(path);
  }

  const file = await downloadFile(url, join(path, "backup.zip"))

  uncompact ? new AdmZip(file).extractAllTo(path) : '';
  uncompact ? unlinkSync(file) : false;

  return path;
};

module.exports = { download }