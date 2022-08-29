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
exports.TreeItem = exports.AppTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const icons_1 = require("../../types/icons");
const token_1 = require("../checkers/token");
const requester_1 = require("../requester");
var StatusLabels;
(function (StatusLabels) {
    StatusLabels["cont"] = "Container";
    StatusLabels["cpu"] = "CPU";
    StatusLabels["ram"] = "RAM";
    StatusLabels["ssd"] = "SSD NVMe";
    StatusLabels["net"] = "Network";
    StatusLabels["lstr"] = "\u00DAltima Reinicializa\u00E7\u00E3o";
})(StatusLabels || (StatusLabels = {}));
class AppTreeDataProvider {
    constructor(cache) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.data = [];
        this.cache = cache;
    }
    async verifyApps() {
        const token = await (0, token_1.checkIfHasToken)();
        if (!token) {
            return;
        }
        const getUser = await (0, requester_1.requester)("get", `/user`, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { "api-token": `${token}` },
        });
        const getApps = await (0, requester_1.requester)("get", `app/all/status`, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { "api-token": `${token}` },
        });
        if (!getUser) {
            return;
        }
        const tree = [];
        for (const app of getUser.user.appsStatus) {
            if (!app) {
                continue;
            }
            let childrens;
            if (getApps) {
                const infoApp = getApps.apps.filter((r) => r.id === app.id)[0];
                childrens = {
                    cont: new ChildrenTreeItem(StatusLabels.cont, infoApp.container, vscode.TreeItemCollapsibleState.None, { iconName: "container" }),
                    ram: new ChildrenTreeItem(StatusLabels.ram, infoApp.memory, vscode.TreeItemCollapsibleState.None, { iconName: "ram" }),
                    cpu: new ChildrenTreeItem(StatusLabels.cpu, infoApp.cpu, vscode.TreeItemCollapsibleState.None, { iconName: "cpu" }),
                    ssd: new ChildrenTreeItem(StatusLabels.ssd, infoApp.ssd, vscode.TreeItemCollapsibleState.None, { iconName: "ssd" }),
                    net: new ChildrenTreeItem(StatusLabels.net, `⬆${infoApp.netIO.up} ⬇${infoApp.netIO.down}`, vscode.TreeItemCollapsibleState.None, { iconName: "network" }),
                    lstr: new ChildrenTreeItem(StatusLabels.lstr, infoApp.last_restart, vscode.TreeItemCollapsibleState.None, { iconName: "uptime" }),
                };
            }
            tree.push(new TreeItem(`${app.name}`, vscode.TreeItemCollapsibleState.Collapsed, {
                iconName: app.online
                    ? icons_1.statusIcons.onl
                    : app.ramKilled
                        ? icons_1.statusIcons.rak
                        : icons_1.statusIcons.off,
                //@ts-ignore
                children: getApps && childrens ? Object.values(childrens) : undefined,
                tooltip: app.id,
            }));
        }
        this.cache.set(`apps-user_verify`, getUser);
        this.cache.set(`apps_user`, getApps);
        this.createTreeItem(tree);
    }
    createTreeItem(array) {
        this.data = array;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }
    refresh() {
        this.verifyApps();
        this._onDidChangeTreeData.fire();
    }
}
exports.AppTreeDataProvider = AppTreeDataProvider;
class TreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, options) {
        super(label, collapsibleState);
        this.collapsibleState = collapsibleState;
        this.children = options?.children;
        this.iconName = options?.iconName;
        this.tooltip = options?.tooltip;
        this.iconPath = {
            light: path.join(__filename, "..", "..", "..", "assets", "light", `${this.iconName}.svg`),
            dark: path.join(__filename, "..", "..", "..", "assets", "dark", `${this.iconName}.svg`),
        };
    }
}
exports.TreeItem = TreeItem;
class ChildrenTreeItem extends vscode.TreeItem {
    constructor(label, value, collapsibleState, options) {
        super(label, collapsibleState);
        this.collapsibleState = collapsibleState;
        this.children = options?.children;
        this.description = value;
        this.iconName = options?.iconName;
        this.iconPath = {
            light: path.join(__filename, "..", "..", "..", "assets", "light", `${this.iconName}.svg`),
            dark: path.join(__filename, "..", "..", "..", "assets", "dark", `${this.iconName}.svg`),
        };
    }
}
//# sourceMappingURL=tree.js.map