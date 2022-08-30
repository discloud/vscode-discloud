import { readdirSync } from "fs";
import { join } from "path";
import * as vscode from "vscode";
import { AppTreeDataProvider } from "../functions/api/tree";
import { check } from "../functions/checkers/config";

interface Command {
  name: string;
  run: (uri: vscode.Uri) => void;
}

export class Discloud {
  commands: Command[];
  subscriptions: { dispose(): any }[];
  cache: Map<string, any>;
  bars: Map<string, vscode.StatusBarItem>;
  trees: Map<string, vscode.TreeDataProvider<any>>;
  config: vscode.WorkspaceConfiguration;
  mainTree?: AppTreeDataProvider;

  constructor(context: vscode.ExtensionContext) {
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
            async (uri: vscode.Uri) => {
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
    uploadBar.text = "$(cloud-upload) Upload to Discloud";

    this.subscriptions.push(uploadBar);
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