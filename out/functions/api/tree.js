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
exports.AppTreeDataProvider = void 0;
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
    StatusLabels["net"] = "NetWork";
    StatusLabels["lstr"] = "\u00DAltima Reinicializa\u00E7\u00E3o";
})(StatusLabels || (StatusLabels = {}));
class AppTreeDataProvider {
    constructor() {
        this.data = [];
        this.cache = new Map();
        this.verifyApps();
    }
    async verifyApps() {
        const token = await (0, token_1.checkIfHasToken)();
        if (!token) {
            return;
        }
        const getApps = await (0, requester_1.requester)("get", `/user`, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { "api-token": `${token}` },
        });
        const tree = [];
        for (const app of getApps.user.appsStatus) {
            if (!app) {
                continue;
            }
            tree.push(new TreeItem(`${app.name}`, {
                iconName: app.online
                    ? icons_1.statusIcons.onl
                    : app.ramKilled
                        ? icons_1.statusIcons.rak
                        : icons_1.statusIcons.off,
            }));
            console.log(app.online
                ? icons_1.statusIcons.onl
                : app.ramKilled
                    ? icons_1.statusIcons.rak
                    : icons_1.statusIcons.off);
        }
        this.cache.set(`apps-user_verify`, getApps);
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
}
exports.AppTreeDataProvider = AppTreeDataProvider;
class TreeItem extends vscode.TreeItem {
    constructor(label, options) {
        super(label, options?.children === undefined
            ? vscode.TreeItemCollapsibleState.None
            : vscode.TreeItemCollapsibleState.Expanded);
        this.print = () => {
            console.log(this.iconName, this.iconPath);
        };
        this.children = options?.children;
        this.iconName = options?.iconName;
        this.iconPath = {
            light: path.join(__filename, "..", "..", "..", "assets", "light", `${this.iconName}.svg`),
            dark: path.join(__filename, "..", "..", "..", "assets", "dark", `${this.iconName}.svg`),
        };
        this.print();
    }
}
class ChildrenTreeItem extends vscode.TreeItem {
    constructor(label, value, options) {
        super(label, options?.children === undefined
            ? vscode.TreeItemCollapsibleState.None
            : vscode.TreeItemCollapsibleState.Expanded);
        this.print = () => {
            console.log(this.iconName, this.iconPath);
        };
        this.children = options?.children;
        this.description = value;
        this.iconName = this.label
            ?.toString()
            .toLowerCase()
            .slice(0, 3);
        this.iconPath = {
            light: path.join(__filename, "..", "..", "..", "src", "assets", "light", `${icons_1.statusIcons[this.iconName]}.svg`),
            dark: path.join(__filename, "..", "..", "..", "src", "assets", "dark", `${icons_1.statusIcons[this.iconName]}.svg`),
        };
        this.print();
    }
}
//# sourceMappingURL=tree.js.map