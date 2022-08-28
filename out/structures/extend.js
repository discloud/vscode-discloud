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
exports.Discloud = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const vscode = __importStar(require("vscode"));
class Discloud {
    constructor(context) {
        this.commands = [];
        this.subscriptions = context.subscriptions;
        this.loadCommands();
        this.init();
        this.cache = new Map();
    }
    init() {
        for (const command of this.commands) {
            let disp = vscode.commands.registerCommand(`discloud.${command.name}`, async (uri) => {
                await command.run(this.cache, uri);
            });
            this.subscriptions.push(disp);
        }
        return console.log("[DISCLOUD] Extension has loaded all commands.");
    }
    loadCommands() {
        const categories = (0, fs_1.readdirSync)((0, path_1.join)(__filename, "..", "..", "commands"));
        for (const category of categories) {
            const commands = (0, fs_1.readdirSync)((0, path_1.join)(__filename, "..", "..", "commands", category)).filter(r => r.endsWith('.js'));
            for (const command of commands) {
                const commandClass = require((0, path_1.join)(__filename, "..", "..", "commands", category, command));
                const cmd = new (commandClass)(this);
                this.commands.push(cmd);
            }
        }
    }
}
exports.Discloud = Discloud;
//# sourceMappingURL=extend.js.map