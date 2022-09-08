const vscode = require("vscode");
const { requester } = require("../requester");
const { ChildrenTreeItem, TreeItem } = require("./treeItem");

class AppTreeDataProvider {

  constructor(cache) {
    this.data = [];
    this.cache = cache;
    this.init();
    this.refresh();
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  async verifyApps() {
    const token = await vscode.workspace
      .getConfiguration("discloud")
      .get("token");
    if (!token) {
      return;
    }

    const getUser = await requester(
      `/vscode`,
      {
        headers: { "api-token": `${token}` },
        method: "GET",
      },
      { isVS: true }
    );

    if (!getUser) {
      return;
    }

    const tree = [];

    for await (const app of getUser.user.appsStatus) {
      if (!app) {
        continue;
      }

      let childrens;

      if (getUser) {
        const infoApp = getUser.user.appsStatus.filter(
          (r) => r.id === app.id
        )[0];

        if (infoApp.container !== "Offline") {
          childrens = {
            cont: new ChildrenTreeItem(
              `Container`,
              infoApp.container,
              vscode.TreeItemCollapsibleState.None,
              { iconName: "container" }
            ),
            ram: new ChildrenTreeItem(
              "RAM",
              infoApp.memory,
              vscode.TreeItemCollapsibleState.None,
              { iconName: "ram" }
            ),
            cpu: new ChildrenTreeItem(
              "CPU",
              infoApp.cpu,
              vscode.TreeItemCollapsibleState.None,
              { iconName: "cpu" }
            ),
            ssd: new ChildrenTreeItem(
              "SSD NVMe",
              infoApp.ssd,
              vscode.TreeItemCollapsibleState.None,
              { iconName: "ssd" }
            ),
            net: new ChildrenTreeItem(
              "Network",
              `⬆${infoApp.netIO.up} ⬇${infoApp.netIO.down}`,
              vscode.TreeItemCollapsibleState.None,
              { iconName: "network" }
            ),
            lstr: new ChildrenTreeItem(
              "Última Reinicialização",
              infoApp.last_restart, 
              vscode.TreeItemCollapsibleState.None,
              { iconName: "uptime" }
            ),
          };
        }
      }

      tree.push(
        new TreeItem(`${app.name}`, Object.values(childrens).length <= 0 ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed, {
          iconName: app.online
            ? "on"
            : app.ramKilled
            ? "ramKilled"
            : app.exitCode == 1 ? "errorCode" : "off",

          children: (childrens && app.online) ? Object.values(childrens) : undefined,
          tooltip: app.id,
        })
      );
    }

    this.cache.set(`apps-user_verify`, getUser);
    tree.length > 0
      ? await this.createTreeItem(tree)
      : await this.createTreeItem([
          new TreeItem(
            "Nenhuma aplicação foi encontrada.",
            vscode.TreeItemCollapsibleState.None,
            { iconName: "x" }
          ),
        ]);
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

  async refresh(data) {
    const token = vscode.workspace.getConfiguration("discloud").get("token");
    if (!token) {
      return;
    }

    if (data) {
      data.length > 0
        ? await this.createTreeItem(data)
        : await this.createTreeItem([
            new TreeItem(
              "Nenhuma aplicação foi encontrada.",
              vscode.TreeItemCollapsibleState.None,
              { iconName: "x" }
            ),
          ]);
    } else {
      await this.verifyApps();
    }
    this._onDidChangeTreeData.fire();
    console.log("[TREE] Refreshed.");
  }

  async init() {
    const token = vscode.workspace.getConfiguration("discloud").get("token");
    if (!token) {
      return;
    } else {
      this.data = [
        new TreeItem(
          "Nenhuma aplicação foi encontrada.",
          vscode.TreeItemCollapsibleState.None,
          { iconName: "x" }
        ),
      ];
    }
  }
};

module.exports = { AppTreeDataProvider };