const { Dispatcher, request } = require("undici");
const vscode = require("vscode");
const { createLogs } = require("./toLogs");

let { maxUses, uses, time, remain } = {
  maxUses: 60,
  uses: 0,
  time: 60000,
  remain: 60,
};

setInterval(() => {
  uses > 0 ? uses-- : false;
}, time);

let hasProcess = { i: false, p: "" };

module.exports = async function requester(
  url,
  config,
  options
) {
  if (hasProcess.i && (options && !options.isVS || !options)) {
    vscode.window.showErrorMessage(
      `Você já tem um processo de ${hasProcess.p} em execução.`
    );
    return;
  } else {
    hasProcess = { i: true, p: `${url.split("/")[url.split("/").length - 1]}` };
  }

  if (uses > maxUses || remain === 0) {
    vscode.window.showInformationMessage(
      `Você atingiu o limite de requisições. Espere ${Math.floor(
        time / 1000
      )} segundos para usar novamente.`
    );
    return;
  }

  let data;
  try {
    data = await request(`https://api.discloud.app/v2${url}`, config);

    uses++;
    maxUses = await parseInt(`${data.headers["ratelimit-limit"]}`);
    time = (await parseInt(`${data.headers["ratelimit-reset"]}`)) * 1000;
    remain = await parseInt(`${data.headers["ratelimit-remaining"]}`);

    hasProcess.i = false;
  } catch (err) {
    hasProcess.i = false;
    if (err?.status === 401) {
      vscode.window.showErrorMessage(err.body.message);
      return;
    }
    if (err?.statusCode === 404) {
      return;
    }
    if (err === "Invalid endpoint") {
      return vscode.window.showErrorMessage(
        `https://api.discloud.app/v2/${url}`
      );
    }

    return vscode.window.showErrorMessage(
      `${err.body ? err.body.message : err}`
    );
  }

  const fixData = await data.body.json();

  if ([504, 222].includes(data.statusCode) && fixData.status === "error") {
    createLogs(fixData.message, { text: fixData.logs }, "error_app.log", { type: "normal" });
    return 222;
  }

  return fixData;
}
