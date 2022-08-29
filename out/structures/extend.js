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
const tree_1 = require("../functions/api/tree");
const config_1 = require("../functions/checkers/config");
class Discloud {
    constructor(context) {
        this.commands = [];
        this.subscriptions = context.subscriptions;
        this.cache = new Map();
        this.bars = new Map();
        this.trees = new Map();
        this.mainTree;
        this.config = vscode.workspace.getConfiguration("discloud");
        this.currentConfig;
        this.loadCommands();
        this.loadStatusBar();
        this.loadTrees();
    }
    loadCommands() {
        const categories = (0, fs_1.readdirSync)((0, path_1.join)(__filename, "..", "..", "commands"));
        for (const category of categories) {
            const commands = (0, fs_1.readdirSync)((0, path_1.join)(__filename, "..", "..", "commands", category)).filter((r) => r.endsWith(".js"));
            for (const command of commands) {
                const commandClass = require((0, path_1.join)(__filename, "..", "..", "commands", category, command));
                const cmd = new commandClass(this);
                let disp = vscode.commands.registerCommand(`${category}.${cmd.name}`, async (uri) => {
                    await cmd.run(uri);
                });
                this.subscriptions.push(disp);
                this.commands.push(cmd);
            }
        }
        console.log("[DISCLOUD] Extension has loaded all commands.");
    }
    loadStatusBar() {
        const uploadBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 40);
        uploadBar.command = "discloud.upload";
        uploadBar.text = "$(cloud-upload) Upload to Discloud";
        this.subscriptions.push(uploadBar);
        const work = vscode.workspace.workspaceFolders;
        const file = work ? work[0].uri.fsPath : '';
        const getConfig = (0, config_1.check)(file, true);
        this.currentConfig = getConfig;
        uploadBar.show();
        this.cache.set('config', this.currentConfig);
        this.cache.set('upload_bar', uploadBar);
        this.bars.set('upload_bar', uploadBar);
    }
    loadTrees() {
        const apps = new tree_1.AppTreeDataProvider(this.cache);
        vscode.window.registerTreeDataProvider("discloud-apps", apps);
        this.mainTree = apps;
    }
}
exports.Discloud = Discloud;
//# sourceMappingURL=extend.js.map