const vscode = require("vscode");
const path = require("path");
const { statusIcons } = require("../../types/icons");
const { requester } = require("../requester");
const { User } = require("../../types/apps");

module.exports = class AppTreeDataProvider {
  constructor(cache) {
    this.data = [];
    this.cache = cache;
    this.init();
    this.refresh();
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
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

        childrens = {
          cont: new ChildrenTreeItem(
            `Container`,
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

          children: childrens ? Object.values(childrens) : undefined,
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

module.exports = class TreeItem extends vscode.TreeItem {
  constructor(label, collapsibleState, options) {
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
        "..",
        "resources",
        "light",
        `${this.iconName}.svg`
      ),
      dark: path.join(
        __filename,
        "..",
        "..",
        "..",
        "..",
        "resources",
        "dark",
        `${this.iconName}.svg`
      ),
    };
  }
};

class ChildrenTreeItem extends vscode.TreeItem {
  constructor(label, value, collapsibleState, options) {
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
        "..",
        "resources",
        "light",
        `${this.iconName}.svg`
      ),
      dark: path.join(
        __filename,
        "..",
        "..",
        "..",
        "..",
        "resources",
        "dark",
        `${this.iconName}.svg`
      ),
    };
  }
}
