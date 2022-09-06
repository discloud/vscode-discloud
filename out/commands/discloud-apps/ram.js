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
const requester_1 = require("../../functions/requester");
const command_1 = require("../../structures/command");
const vscode = __importStar(require("vscode"));
module.exports = class extends command_1.Command {
    constructor(discloud) {
        super(discloud, {
            name: "ramEntry",
        });
    }
    run = async (item) => {
        const token = this.discloud.config.get("token");
        if (!token) {
            return;
        }
        const toPut = await vscode.window.showInputBox({
            title: "Coloque a nova quantidade de RAM que o app irá usar.",
        });
        if (!toPut || !Number.isInteger(parseInt(`${toPut}`))) {
            return vscode.window.showErrorMessage("Operação cancelada pois valor recebido é inválido.");
        }
        const obj = {
            ramMB: parseInt(`${toPut}`),
        };
        const ram = await (0, requester_1.requester)(`/app/${item.tooltip}/ram`, {
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "api-token": token,
                "Content-type": "application/json"
            },
            body: JSON.stringify(obj),
            method: "PUT",
        });
        if (!ram) {
            return;
        }
        vscode.window.showInformationMessage(`${ram.message}`);
        await this.discloud.mainTree?.refresh();
    };
};
//# sourceMappingURL=ram.js.map