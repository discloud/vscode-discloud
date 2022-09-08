const path = require("path");
const vscode = require("vscode");

class TreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, options) {
      super(label, collapsibleState);
      this.children = options.children;
      this.iconName = options.iconName;
      this.tooltip = options.tooltip;
      this.iconPath = {
        light: path.join(
          __filename,
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
      this.children = options.children;
      this.description = value;
      this.iconName = options.iconName;
      this.iconPath = {
        light: path.join(
          __filename,
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
          "resources",
          "dark",
          `${this.iconName}.svg`
        ),
      };
    }
  }
  
module.exports = { TreeItem, ChildrenTreeItem }