const { readFileSync, existsSync } = require("fs");
const vscode = require("vscode");

function check(path, getObj) {
  try {
    existsSync(path);
  } catch (err) {
    return null;
  }

  const file = readFileSync(path, { encoding: "utf8" });
  if (!file && !getObj) {
    return vscode.window.showErrorMessage(
      `Você não pode usar esta função com um discloud.config inválido.\nCheque a Documentação para Dúvidas: https://docs.discloudbot.com/suporte/faq/discloud.config`
    );
  }

  const splited = file.split("\n").filter((r) => r.includes("="));
  let requiredScopes = {};
  let isSite = { hasID: false, site: false };
  for (const item of splited) {
    if (
      Object.keys(requiredScopes).includes(item.split("=")[0].toLowerCase())
    ) {
      requiredScopes[item.split("=")[0].toLowerCase()].value =
        item.split("=")[1];
    }

    if (item === "TYPE=site") {
      isSite.site = true;
      splited.filter((r) => r.includes("ID=")).length > 0
        ? (isSite.hasID = true)
        : "";
    }
  }

  if (
    (Object.values(requiredScopes).filter((r) => !r.value).length > 0 ||
      (!isSite.hasID && isSite.site)) &&
    !getObj
  ) {
    return vscode.window.showErrorMessage(
      "Você não adicionou parâmetros obrigatórios no discloud.config!\nhttps://docs.discloudbot.com/suporte/faq/discloud.config"
    );
  }

  return getObj ? requiredScopes : true;
};

module.exports = { check };