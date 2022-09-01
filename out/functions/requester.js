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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requester = void 0;
const axios_1 = __importDefault(require("axios"));
const vscode = __importStar(require("vscode"));
const toLogs_1 = require("./toLogs");
let { maxUses, uses, time, remain } = { maxUses: 60, uses: 0, time: 60000, remain: 60 };
setInterval(() => { uses > 0 ? uses-- : false; }, time);
let hasProcess = { i: false, p: '' };
async function requester(method, url, config, options) {
    if (hasProcess.i && (options && !options.isVS)) {
        vscode.window.showErrorMessage(`Você já tem um processo de ${hasProcess.p} em execução.`);
        return;
    }
    else {
        hasProcess = { i: true, p: `${url.split('/')[url.split('/').length - 1]}` };
    }
    if (uses > maxUses || remain === 0) {
        vscode.window.showInformationMessage(`Você atingiu o limite de requisições. Espere ${Math.floor(time / 1000)} segundos para usar novamente.`);
        return;
    }
    const methods = {
        put: axios_1.default.put,
        get: axios_1.default.get,
        post: axios_1.default.post,
        del: axios_1.default.delete
    };
    config ? config['baseURL'] = "https://api.discloud.app/v2" : config = { baseURL: "https://api.discloud.app/v2" };
    let data;
    try {
        data = ((options && (options.d && Object.keys(options.d).length > 1)) ? await methods[method](url, options.d, config) : await methods[method](url, config));
        uses++;
        maxUses = await parseInt(data.headers["ratelimit-limit"]);
        time = await parseInt(data.headers["ratelimit-reset"]) * 1000;
        remain = await parseInt(data.headers["ratelimit-remaining"]);
        data = data.data;
        hasProcess.i = false;
    }
    catch (err) {
        hasProcess.i = false;
        if (err?.response?.status === 401) {
            vscode.window.showErrorMessage(err.response.data.message);
            return;
        }
        if (err?.response?.statusCode === 404) {
            return;
        }
        return vscode.window.showErrorMessage(`${err.response?.data ? err.response.data?.message : err}`);
    }
    if ([504, 222].includes(data.statusCode) && data.status === "error") {
        (0, toLogs_1.createLogs)(data.message, { text: data.logs }, "error_app.log");
        return 222;
    }
    return data;
}
exports.requester = requester;
//# sourceMappingURL=requester.js.map