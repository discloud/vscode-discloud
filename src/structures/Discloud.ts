import { t } from "@vscode/l10n";
import { allBlockedFilesRegex } from "discloud.app";
import { EventEmitter } from "node:events";
import { existsSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { commands, env, ExtensionContext, StatusBarAlignment, window, workspace } from "vscode";
import { Events, TaskData } from "../@types";
import { logger } from "../extension";
import AppTreeDataProvider from "../providers/AppTreeDataProvider";
import CustomDomainTreeDataProvider from "../providers/CustomDomainTreeDataProvider";
import SubDomainTreeDataProvider from "../providers/SubDomainTreeDataProvider";
import TeamAppTreeDataProvider from "../providers/TeamAppTreeDataProvider";
import UserTreeDataProvider from "../providers/UserTreeDataProvider";
import AutoRefresh from "./AutoRefresh";
import Command from "./Command";
import StatusBarItem from "./StatusBarItem";
import VSUser from "./VSUser";

const fileExt = extname(__filename);

interface Discloud extends EventEmitter {
  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void | Promise<void>): this
  on<S extends string | symbol>(event: Exclude<S, keyof Events>, listener: (...args: any[]) => void | Promise<void>): this
  once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void | Promise<void>): this
  once<S extends string | symbol>(event: Exclude<S, keyof Events>, listener: (...args: any[]) => void | Promise<void>): this
  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean
  emit<S extends string | symbol>(event: Exclude<S, keyof Events>, ...args: unknown[]): boolean
  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void | Promise<void>): this
  off<S extends string | symbol>(event: Exclude<S, keyof Events>, listener: (...args: any[]) => void | Promise<void>): this
}

class Discloud extends EventEmitter {
  declare autoRefresher: AutoRefresh;
  declare context: ExtensionContext;
  declare appTree: AppTreeDataProvider;
  declare customDomainTree: CustomDomainTreeDataProvider;
  declare subDomainTree: SubDomainTreeDataProvider;
  declare teamAppTree: TeamAppTreeDataProvider;
  declare userTree: UserTreeDataProvider;
  declare statusBar: StatusBarItem;
  cache = new Map();
  commands = new Map<string, Command>();
  bars = new Map<string, StatusBarItem>();
  user = new VSUser();

  constructor() {
    super();
  }

  get config() {
    return workspace.getConfiguration("discloud");
  }

  get hasToken() {
    if (this.token) return true;
    window.showErrorMessage(t("missing.token"));
    return false;
  }

  get logger() {
    return logger;
  }

  get token() {
    return this.config.get<string>("token");
  }

  get workspaceAvailable() {
    return Boolean(workspace.workspaceFolders?.length);
  }

  get workspaceFolder() {
    return workspace.workspaceFolders?.[0]?.uri.fsPath.replace(/\\/g, "/");
  }

  get workspaceIgnoreList() {
    const workspaceFolder = this.workspaceFolder;
    if (!workspaceFolder) return [];

    return [
      "app.backup.dir",
      "app.import.dir",
      "team.backup.dir",
      "team.import.dir",
    ]
      .map(config => this.config.get(config))
      .filter(c => c)
      .map(config => `${workspaceFolder}/${config}/**`)
      .concat(`${workspaceFolder}/discloud/**`);
  }

  async copyFilePath() {
    await commands.executeCommand("copyFilePath");
    const copied = await env.clipboard.readText().then(a => a.replace(/\\/g, "/"));

    const paths = copied.split(/[\r\n]+/g)
      .filter(path => !allBlockedFilesRegex.test(path))
      .filter(path => existsSync(path));

    if (this.workspaceFolder) {
      if (!paths.length) return [this.workspaceFolder];
      if (paths.length === 1 && paths[0] === ".") return [this.workspaceFolder];
    }

    return paths;
  }

  async loadCommands(dir = join(__dirname, "..", "commands"), category = "discloud") {
    if (!existsSync(dir)) return;

    const files = readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      if (file.isDirectory()) {
        this.loadCommands(join(dir, file.name), `${category}.${file.name}`);

        continue;
      }

      if (file.isFile()) {
        if (!file.name.endsWith(fileExt)) continue;

        const imported = await import(`${join(dir, file.name)}`);

        let command: Command;
        try {
          command = new (imported.default ?? imported)(this);
        } catch {
          command = imported.default ?? imported;
        }

        const commandName = `${category}.${file.name.replace(extname(file.name), "")}`;

        const disposable = commands.registerCommand(commandName, async (...args) => {
          if (!command.data.noToken)
            if (!this.hasToken) return;

          const taskData = <TaskData>{};

          if (command.data.progress) {
            await window.withProgress(command.data.progress, async (progress, token) => {
              token.onCancellationRequested(() => this.resetStatusBar());

              taskData.progress = progress;
              taskData.token = token;

              try {
                await command.run(taskData, ...args);
              } catch {
                this.resetStatusBar();
              }
            });
          } else {
            try {
              await command.run(taskData, ...args);
            } catch {
              this.resetStatusBar();
            }
          }
        });

        this.context.subscriptions.push(disposable);

        this.commands.set(commandName, command);

        continue;
      }
    }
  }

  async loadEvents(path = join(__dirname, "..", "events")) {
    if (!existsSync(path)) return;

    const files = readdirSync(path, { withFileTypes: true });

    for (const file of files)
      if (file.isFile()) {
        if (!file.name.endsWith(fileExt)) continue;

        await import(`${join(path, file.name)}`);
      }
  }

  loadStatusBar() {
    this.statusBar = new StatusBarItem({
      alignment: StatusBarAlignment.Left,
      priority: 40,
      text: t("status.text"),
      tooltip: t("status.tooltip"),
    });

    this.bars.set("statusbar", this.statusBar);

    return this.bars;
  }

  async resetStatusBar(bars?: StatusBarItem | StatusBarItem[]) {
    if (bars instanceof StatusBarItem)
      return bars.reset();

    for (const bar of bars ?? this.bars.values())
      bar.reset();
  }

  activate(context: ExtensionContext) {
    this.context = context;
    this.emit("activate", context);
  }
}

export default Discloud;
