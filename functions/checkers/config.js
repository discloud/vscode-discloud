const { readFileSync, existsSync } = require("fs");
const vscode = require("vscode");

const required_scopes = ["MAIN", "TYPE", "RAM", "VERSION"]

function getMissingValues(obj, values) {
  return values.filter(key => !obj[key]);
}

function check(path, getObj) {
  try {
    existsSync(path);
  } catch (err) {
    return null;
  }

  const file = readFileSync(path, { encoding: "utf8" });
  if (!file) {
    return vscode.window.showErrorMessage(
      `Você não pode usar esta função com um discloud.config inválido.\nCheque a Documentação para Dúvidas: https://docs.discloudbot.com/suporte/faq/discloud.config`
    );
  }

  const scopes = Object.fromEntries(file.split(/\r?\n/).map(a => a.split("=")));

  if (scopes.TYPE === 'site') {
    required_scopes.push("ID")
  } else {
    required_scopes.push("NAME")
  }

  if (getObj ? false : getMissingValues(scopes, required_scopes).length) {
    return vscode.window.showErrorMessage(
      `Você não adicionou parâmetros obrigatórios no discloud.config!\nCheque a documentação: https://docs.discloudbot.com/suporte/faq/discloud.config`
    );
  }

  return getObj ? scopes : true;
};

module.exports = { check };