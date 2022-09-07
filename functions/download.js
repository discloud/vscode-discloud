const vscode = require("vscode");
const { existsSync, mkdirSync, unlinkSync } = require("fs");
const AdmZip = require("adm-zip");
const { downloadFile } = require("./mkDownload");

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

  if (!existsSync(targetPath + "\\backup")) {
    mkdirSync(targetPath + "\\backup");
  }

  const file = await downloadFile(url, targetPath + "\\backup\\backup.zip")

  uncompact ? new AdmZip(file).extractAllTo(targetPath + "\\backup") : '';
  uncompact ? unlinkSync(file) : false;

  return targetPath + "\\backup";
};

module.exports = { download }