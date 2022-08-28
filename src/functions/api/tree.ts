import * as vscode from "vscode";
import * as path from "path";
import { StatusIcons, statusIcons } from "../../types/icons";
import { checkIfHasToken } from "../checkers/token";
import { requester } from "../requester";

enum StatusLabels {
  cont = "Container",
  cpu = "CPU",
  ram = "RAM",
  ssd = "SSD NVMe",
  net = "NetWork",
  lstr = "Última Reinicialização",
}

export class AppTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  onDidChangeTreeData?: vscode.Event<TreeItem | null | undefined> | undefined;
  // private _onDidChangeTreeData: vscode.EventEmitter<
  //   TreeItem | undefined | null | void
  // > = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  // readonly onDidChangeTreeData: vscode.Event<
  //   TreeItem | undefined | null | void
  // > = this._onDidChangeTreeData.event;

  data: TreeItem[];
  cache: Map<any, any>;

  constructor() {
    this.data = [];
    this.cache = new Map();

    this.verifyApps();
  }

  async verifyApps() {
    const token = await checkIfHasToken();
    if (!token) {
      return;
    }

    const getApps: User = await requester("get", `/user`, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { "api-token": `${token}` },
    });

    const tree: TreeItem[] = [];

    for (const app of getApps.user.appsStatus) {
      if (!app) { continue; }
      tree.push(
        new TreeItem(`${app.name}`, {
          iconName: app.online
            ? statusIcons.onl
            : app.ramKilled
            ? statusIcons.rak
            : statusIcons.off,
        })
      );

      console.log(app.online
        ? statusIcons.onl
        : app.ramKilled
        ? statusIcons.rak
        : statusIcons.off);
    }

    this.cache.set(`apps-user_verify`, getApps);
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

  // refresh() {
  //   this._onDidChangeTreeData.fire();
  // }
}

class TreeItem extends vscode.TreeItem {
  children: TreeItem[] | undefined;
  iconName?: string;

  constructor(
    label: string,
    options?: { children?: ChildrenTreeItem[]; iconName?: string }
  ) {
    super(
      label,
      options?.children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Expanded
    );
    this.children = options?.children;
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
    this.print();
  }

  print = () => {
    console.log(this.iconName, this.iconPath);
  };
}

class ChildrenTreeItem extends vscode.TreeItem {
  children: TreeItem[] | undefined;
  iconName?: string;

  constructor(
    label: StatusLabels,
    value: string,
    options?: { children?: TreeItem[] }
  ) {
    super(
      label,
      options?.children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Expanded
    );
    this.children = options?.children;
    this.description = value;
    this.iconName = (this.label as StatusLabels)
      ?.toString()
      .toLowerCase()
      .slice(0, 3);
    this.iconPath = {
      light: path.join(
        __filename,
        "..",
        "..",
        "..",
        "src",
        "assets",
        "light",
        `${
          (statusIcons as unknown as Record<string, StatusIcons | undefined>)[
            this.iconName
          ]
        }.svg`
      ),
      dark: path.join(
        __filename,
        "..",
        "..",
        "..",
        "src",
        "assets",
        "dark",
        `${
          (statusIcons as unknown as Record<string, StatusIcons | undefined>)[
            this.iconName
          ]
        }.svg`
      ),
    };
    this.print();
  }

  print = () => {
    console.log(this.iconName, this.iconPath);
  };
}
