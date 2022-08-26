import * as vscode from 'vscode';
import * as path from 'path';

export class AppTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  onDidChangeTreeData?: vscode.Event<TreeItem|null|undefined>|undefined;

  data: TreeItem[];

  constructor() {
    this.data = [new TreeItem('Meu Bot Python', [new TreeItem('Container'), new TreeItem('CPU'), new TreeItem('RAM'), 
    new TreeItem('SSD NVMe'), new TreeItem('Network'), new TreeItem('Última reinicialização')]), 

    new TreeItem('Meu bot outro javascript'),
    new TreeItem('outrosite.disclou.app'),
    new TreeItem('seusite.disclou.app'),
    new TreeItem('suaapi.disclou.app'),
    new TreeItem('Meu bot outro ruby')];
  }

  getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }
}

class TreeItem extends vscode.TreeItem {
  children: TreeItem[]|undefined;

  constructor(label: string, children?: TreeItem[]) {
    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Expanded);
    this.children = children;
    console.log(this.label);
    this.description =  this.label === "Container" ? "Offiline" : this.label === "CPU" ? "0.00%" : this.label === "RAM" ? "65.1MB/100MB"  :  this.label === "SSD NVMe" ? "521MB"  :  this.label === "Network" ? "⬇15MB ⬆2MB"  :  this.label === "Última reinicialização" ? "um dia"  : "" ;
    this.iconPath = {
		light: path.join(__filename, '..', '..', '..', 'src', 'assets', 'light', this.label === "Container" ? "container.svg" : this.label === "CPU" ? "cpu.svg" : this.label === "RAM" ? "ram.svg"  :  this.label === "SSD NVMe" ? "ssd.svg"  :  this.label === "Network" ? "network.svg"  :  this.label === "Última reinicialização" ? "uptime.svg"  : this.label === "Meu Bot Python" ? "on.svg" : this.label === "Meu bot outro javascript" ? "ramKilled.svg" : this.label === "outrosite.disclou.app" ? "errorCode.svg" : "off.svg"),
		dark: path.join(__filename, '..', '..', '..', 'src', 'assets', 'dark', this.label === "Container" ? "container.svg" : this.label === "CPU" ? "cpu.svg" : this.label === "RAM" ? "ram.svg"  :  this.label === "SSD NVMe" ? "ssd.svg"  :  this.label === "Network" ? "network.svg"  :  this.label === "Última reinicialização" ? "uptime.svg"  : this.label === "Meu Bot Python" ? "on.svg" : this.label === "Meu bot outro javascript" ? "ramKilled.svg" : this.label === "outrosite.disclou.app" ? "errorCode.svg" : "off.svg")
	};
  }
}