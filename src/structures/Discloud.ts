import { t } from "@vscode/l10n";
import { EventEmitter } from "node:events";
import { existsSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { ExtensionContext, StatusBarAlignment, commands, window, workspace } from "vscode";
import { Events, TaskData } from "../@types";
import { logger } from "../extension";
import AppTreeDataProvider from "../providers/AppTreeDataProvider";
import CustomDomainTreeDataProvider from "../providers/CustomDomainTreeDataProvider";
import SubDomainTreeDataProvider from "../providers/SubDomainTreeDataProvider";
import TeamAppTreeDataProvider from "../providers/TeamAppTreeDataProvider";
import UserTreeDataProvider from "../providers/UserTreeDataProvider";
import Command from "./Command";
import StatusBarItem from "./StatusBarItem";
import VSUser from "./VSUser";

const fileExt = extname(__filename);

interface Discloud extends EventEmitter {
  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean
  emit<S extends string | symbol>(event: Exclude<S, keyof Events>, ...args: unknown[]): boolean
  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void | Promise<void>): this
  off<S extends string | symbol>(event: Exclude<S, keyof Events>, listener: (...args: any[]) => void | Promise<void>): this
  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void | Promise<void>): this
  on<S extends string | symbol>(event: Exclude<S, keyof Events>, listener: (...args: any[]) => void | Promise<void>): this
  once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void | Promise<void>): this
  once<S extends string | symbol>(event: Exclude<S, keyof Events>, listener: (...args: any[]) => void | Promise<void>): this
}

class Discloud extends EventEmitter {
  declare appTree: AppTreeDataProvider;
  declare context: ExtensionContext;
  declare customDomainTree: CustomDomainTreeDataProvider;
  declare statusBar: StatusBarItem;
  declare subDomainTree: SubDomainTreeDataProvider;
  declare teamAppTree: TeamAppTreeDataProvider;
  declare userTree: UserTreeDataProvider;
  readonly bars = new Map<string, StatusBarItem>();
  readonly cache = new Map();
  readonly commands = new Map<string, Command>();
  readonly user = new VSUser();

  constructor() {
    super();
  }

  get debug() {
    return Boolean(this.config.get<boolean>("debug"));
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

  get secrets() {
    return this.context?.secrets;
  }

  get subscriptions() {
    return this.context?.subscriptions;
  }

  get token() {
    return this.config.get<string>("token");
  }

  get workspaceAvailable() {
    return Boolean(workspace.workspaceFolders?.length);
  }

  get workspaceFolder() {
    return workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  get workspaceIgnoreList() {
    return [
      "app.backup.dir",
      "app.import.dir",
      "team.backup.dir",
      "team.import.dir",
    ]
      .map(config => join(...this.config.get<string>(config)?.split(/[\\/]/) ?? ""))
      .filter(Boolean)
      .concat("discloud", `${workspace.name}.zip`);
  }

  async getFolderDialog(task?: TaskData | null, title?: string, openLabel?: string) {
    task?.progress.report({ message: "Please select a folder." });

    const uris = await window.showOpenDialog({
      canSelectFolders: true,
      title,
      openLabel,
    });

    if (uris?.length) {
      task?.progress.report({ message: "Folder selected." });
    }

    return uris?.[0].fsPath;
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
              } catch (error: any) {
                this.emit("error", error);
                this.resetStatusBar();
              }
            });
          } else {
            try {
              await command.run(taskData, ...args);
            } catch (error: any) {
              this.emit("error", error);
              this.resetStatusBar();
            }
          }
        });

        this.context.subscriptions.push(disposable);

        this.commands.set(commandName, command);

        logger.info(commandName, disposable ? "registered ✅" : "failure ❌");

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
    if (!context) return;
    this.context = context;
    this.appTree = new AppTreeDataProvider("discloud-apps");
    this.customDomainTree = new CustomDomainTreeDataProvider("discloud-domains");
    this.subDomainTree = new SubDomainTreeDataProvider("discloud-subdomains");
    this.teamAppTree = new TeamAppTreeDataProvider("discloud-teams");
    this.userTree = new UserTreeDataProvider("discloud-user");
    this.emit("activate", context);
  }
}

export default Discloud;
