"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requester = void 0;
const undici_1 = require("undici");
const vscode = __importStar(require("vscode"));
const toLogs_1 = require("./toLogs");
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
async function requester(url, config, options) {
    if (hasProcess.i && (options && !options.isVS || !options)) {
        vscode.window.showErrorMessage(`Você já tem um processo de ${hasProcess.p} em execução.`);
        return;
    }
    else {
        hasProcess = { i: true, p: `${url.split("/")[url.split("/").length - 1]}` };
    }
    if (uses > maxUses || remain === 0) {
        vscode.window.showInformationMessage(`Você atingiu o limite de requisições. Espere ${Math.floor(time / 1000)} segundos para usar novamente.`);
        return;
    }
    let data;
    try {
        data = await (0, undici_1.request)(`https://api.discloud.app/v2${url}`, config);
        uses++;
        maxUses = await parseInt(`${data.headers["ratelimit-limit"]}`);
        time = (await parseInt(`${data.headers["ratelimit-reset"]}`)) * 1000;
        remain = await parseInt(`${data.headers["ratelimit-remaining"]}`);
        hasProcess.i = false;
    }
    catch (err) {
        hasProcess.i = false;
        if (err?.status === 401) {
            vscode.window.showErrorMessage(err.body.message);
            return;
        }
        if (err?.statusCode === 404) {
            return;
        }
        if (err === "Invalid endpoint") {
            return vscode.window.showErrorMessage(`https://api.discloud.app/v2/${url}`);
        }
        return vscode.window.showErrorMessage(`${err.body ? err.body.message : err}`);
    }
    const fixData = await data.body.json();
    if ([504, 222].includes(data.statusCode) && fixData.status === "error") {
        (0, toLogs_1.createLogs)(fixData.message, { text: fixData.logs }, "error_app.log", { type: "normal" });
        return 222;
    }
    return fixData;
}
exports.requester = requester;
//# sourceMappingURL=requester.js.map