import * as vscode from "vscode";
import * as path from "path";
import { statusIcons } from "../../types/icons";
import { checkIfHasToken } from "../checkers/token";
import { requester } from "../requester";
import { Status, User } from "../../types/apps";

enum StatusLabels {
  cont = "Container",
  cpu = "CPU",
  ram = "RAM",
  ssd = "SSD NVMe",
  net = "Network",
  lstr = "Última Reinicialização",
}

export class AppTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeItem | undefined | null | void
  > = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  data: TreeItem[];
  cache: Map<any, any>;

  constructor(cache: Map<any, any>) {
    this.data = [];
    this.cache = cache;

    setTimeout(() => {this.refresh();}, 10000);
  }

  async verifyApps() {
    console.log("Call");
    const token = await checkIfHasToken();
    if (!token) {
      return;
    }

    const getUser: User = await requester("get", `/user`, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { "api-token": `${token}` },
    });

    const getApps: Status = await requester("get", `app/all/status`, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { "api-token": `${token}` },
    });

    if (!getUser) {
      return;
    }

    const tree: TreeItem[] = [];

    for (const app of getUser.user.appsStatus) {
      if (!app) {
        continue;
      }

      let childrens: Record<string, ChildrenTreeItem>;

      if (getApps) {
        const infoApp = getApps.apps.filter((r) => r.id === app.id)[0];

        childrens = {
          cont: new ChildrenTreeItem(
            StatusLabels.cont,
            infoApp.container,
            vscode.TreeItemCollapsibleState.None,
            { iconName: "container" }
          ),
          ram: new ChildrenTreeItem(
            StatusLabels.ram,
            infoApp.memory,
            vscode.TreeItemCollapsibleState.None,
            { iconName: "ram" }
          ),
          cpu: new ChildrenTreeItem(
            StatusLabels.cpu,
            infoApp.cpu,
            vscode.TreeItemCollapsibleState.None,
            { iconName: "cpu" }
          ),
          ssd: new ChildrenTreeItem(
            StatusLabels.ssd,
            infoApp.ssd,
            vscode.TreeItemCollapsibleState.None,
            { iconName: "ssd" }
          ),
          net: new ChildrenTreeItem(
            StatusLabels.net,
            `⬆${infoApp.netIO.up} ⬇${infoApp.netIO.down}`,
            vscode.TreeItemCollapsibleState.None,
            { iconName: "network" }
          ),
          lstr: new ChildrenTreeItem(
            StatusLabels.lstr,
            infoApp.last_restart,
            vscode.TreeItemCollapsibleState.None,
            { iconName: "uptime" }
          ),
        };
      }

      tree.push(
        new TreeItem(`${app.name}`, vscode.TreeItemCollapsibleState.Collapsed, {
          iconName: app.online
            ? statusIcons.onl
            : app.ramKilled
            ? statusIcons.rak
            : statusIcons.off,
            //@ts-ignore
          children: getApps && childrens ? Object.values(childrens) : undefined,
          tooltip: app.id,
        })
      );
    }

    this.cache.set(`apps-user_verify`, getUser);
    this.cache.set(`apps_user`, getApps);
    this.createTreeItem(tree);
  }

  createTreeItem(array: TreeItem[]): void {
    this.data = array;
  }

  getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: TreeItem | undefined
  ): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }

  refresh(): void {
    this.verifyApps();
    this._onDidChangeTreeData.fire();
  }
}

export class TreeItem extends vscode.TreeItem {
  children: TreeItem[] | undefined;
  iconName?: string;

  constructor(
    label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    options?: {
      children?: ChildrenTreeItem[];
      iconName?: string;
      tooltip: string;
    }
  ) {
    super(label, collapsibleState);
    this.children = options?.children;
    this.iconName = options?.iconName;
    this.tooltip = options?.tooltip;
    this.iconPath = {
      light: path.join(
        __filename,
        "..",
        "..",
        "..",
        "assets",
        "light",
        `${this.iconName}.svg`
      ),
      dark: path.join(
        __filename,
        "..",
        "..",
        "..",
        "assets",
        "dark",
        `${this.iconName}.svg`
      ),
    };
  }
}

class ChildrenTreeItem extends vscode.TreeItem {
  children: TreeItem[] | undefined;
  iconName?: string;

  constructor(
    label: StatusLabels,
    value: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    options?: { children?: TreeItem[]; iconName?: string }
  ) {
    super(label, collapsibleState);
    this.children = options?.children;
    this.description = value;
    this.iconName = options?.iconName;
    this.iconPath = {
      light: path.join(
        __filename,
        "..",
        "..",
        "..",
        "assets",
        "light",
        `${this.iconName}.svg`
      ),
      dark: path.join(
        __filename,
        "..",
        "..",
        "..",
        "assets",
        "dark",
        `${this.iconName}.svg`
      ),
    };
  }
}
