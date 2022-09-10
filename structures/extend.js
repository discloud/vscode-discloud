const { readdirSync } = require("fs");
const { join } = require("path");
const vscode = require("vscode");
const { AppTreeDataProvider } = require("../functions/api/tree");


module.exports = class Discloud {

  constructor(context) {
    this.commands = [];
    this.subscriptions = context.subscriptions;
    this.cache = new Map();
    this.bars = new Map();
    this.trees = new Map();
    this.mainTree;
    this.config = vscode.workspace.getConfiguration("discloud");
    this.loadCommands();
    this.loadStatusBar();
    this.loadTrees();
  }

  loadCommands() {
    const categories = readdirSync(join(__filename, "..", "..", "commands"));
    for (const category of categories) {
      const commands = readdirSync(
        join(__filename, "..", "..", "commands", category)
      ).filter((r) => r.endsWith(".js"));
      for (const command of commands) {
        const commandClass = require(join(
          __filename,
          "..",
          "..",
          "commands",
          category,
          command
        ));
        const cmd = new commandClass(this);

        let disp = vscode.commands.registerCommand(
            `${category}.${cmd.name}`,
            async (uri) => {
              await cmd.run(uri);
            }
        );
        this.subscriptions.push(disp);

        this.commands.push(cmd);
      }
    }
    console.log("[DISCLOUD] Extension has loaded all commands.");
  }

  loadStatusBar() {
    const uploadBar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      40
    );
    uploadBar.command = "discloud.upload";
    uploadBar.text = "$(cloud-upload) Upload Discloud";

    this.subscriptions.push(uploadBar);
    uploadBar.tooltip = "Upload to Discloud";
    uploadBar.show();
    this.cache.set('upload_bar', uploadBar);
    this.bars.set('upload_bar', uploadBar);
  }

  loadTrees() {
    const apps = new AppTreeDataProvider(this.cache);
    vscode.window.registerTreeDataProvider("discloud-apps", apps);
    this.mainTree = apps;
  }
}

Object.defineProperty(global, 'actualProcess', {
  value: new Map()
});