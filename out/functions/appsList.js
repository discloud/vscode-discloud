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
class AppTreeDataProvider {
    constructor() {
        this.data = [new TreeItem('Meu Bot Python', [new TreeItem('Container'), new TreeItem('CPU'), new TreeItem('RAM'),
                new TreeItem('SSD NVMe'), new TreeItem('Network'), new TreeItem('Última reinicialização')]),
            new TreeItem('Meu bot outro javascript'),
            new TreeItem('outrosite.disclou.app'),
            new TreeItem('seusite.disclou.app'),
            new TreeItem('suaapi.disclou.app'),
            new TreeItem('Meu bot outro ruby')];
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
    constructor(label, children) {
        super(label, children === undefined ? vscode.TreeItemCollapsibleState.None :
            vscode.TreeItemCollapsibleState.Expanded);
        this.children = children;
        console.log(this.label);
        this.description = this.label === "Container" ? "Offiline" : this.label === "CPU" ? "0.00%" : this.label === "RAM" ? "65.1MB/100MB" : this.label === "SSD NVMe" ? "521MB" : this.label === "Network" ? "⬇15MB ⬆2MB" : this.label === "Última reinicialização" ? "um dia" : "";
        this.iconPath = {
            light: path.join(__filename, '..', '..', '..', 'src', 'assets', 'light', this.label === "Container" ? "container.svg" : this.label === "CPU" ? "cpu.svg" : this.label === "RAM" ? "ram.svg" : this.label === "SSD NVMe" ? "ssd.svg" : this.label === "Network" ? "network.svg" : this.label === "Última reinicialização" ? "uptime.svg" : this.label === "Meu Bot Python" ? "on.svg" : this.label === "Meu bot outro javascript" ? "ramKilled.svg" : this.label === "outrosite.disclou.app" ? "errorCode.svg" : "off.svg"),
            dark: path.join(__filename, '..', '..', '..', 'src', 'assets', 'dark', this.label === "Container" ? "container.svg" : this.label === "CPU" ? "cpu.svg" : this.label === "RAM" ? "ram.svg" : this.label === "SSD NVMe" ? "ssd.svg" : this.label === "Network" ? "network.svg" : this.label === "Última reinicialização" ? "uptime.svg" : this.label === "Meu Bot Python" ? "on.svg" : this.label === "Meu bot outro javascript" ? "ramKilled.svg" : this.label === "outrosite.disclou.app" ? "errorCode.svg" : "off.svg")
        };
    }
}
//# sourceMappingURL=appsList.js.map