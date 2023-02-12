import { t } from "@vscode/l10n";
import { allBlockedFilesRegex } from "discloud.app";
import { EventEmitter } from "node:events";
import { existsSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { commands, env, ExtensionContext, StatusBarAlignment, window, workspace } from "vscode";
import { Events, TaskData } from "../@types";
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
  autoRefresher!: AutoRefresh;
  context!: ExtensionContext;
  appTree!: AppTreeDataProvider;
  customDomainTree!: CustomDomainTreeDataProvider;
  subDomainTree!: SubDomainTreeDataProvider;
  teamAppTree!: TeamAppTreeDataProvider;
  userTree!: UserTreeDataProvider;
  statusBar!: StatusBarItem;
  cache = new Map();
  commands = new Map<string, Command>();
  bars = new Map<string, StatusBarItem>();
  user: VSUser;

  constructor() {
    super();
    this.user = new VSUser(this);
  }

  get config() {
    return workspace.getConfiguration("discloud");
  }

  get hasToken() {
    if (this.token) return true;
    window.showErrorMessage(t("missing.token"));
    return false;
  }

  get token() {
    return this.config.get<string>("token");
  }

  get workspaceFolder() {
    return workspace.workspaceFolders?.[0].uri.fsPath.replace(/\\/g, "/");
  }

  get workspaceAvailable() {
    return Boolean(workspace.workspaceFolders?.length);
  }

  async copyFilePath() {
    await commands.executeCommand("copyFilePath");
    const copied = await env.clipboard.readText().then(a => a.replace(/\\/g, "/"));
    const paths = copied.split(/\r?\n/g).filter(path => !allBlockedFilesRegex.test(path));

    if (!paths.length && this.workspaceFolder) return [this.workspaceFolder];
    if (paths.length === 1 && paths[0] === "." && this.workspaceFolder) return [this.workspaceFolder];

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

              await command.run(taskData, ...args);
            });
          } else {
            command.run(taskData, ...args);
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
    this.autoRefresher = new AutoRefresh();
  }
}

export default Discloud;
