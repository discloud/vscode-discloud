import { t } from "@vscode/l10n";
import { EventEmitter } from "events";
import { existsSync, readdirSync } from "fs";
import { extname, join } from "path";
import { ExtensionContext, LogOutputChannel, OutputChannel, StatusBarAlignment, commands, window, workspace } from "vscode";
import { Events, TaskData } from "../@types";
import { logger } from "../extension";
import AppTreeDataProvider from "../providers/AppTreeDataProvider";
import CustomDomainTreeDataProvider from "../providers/CustomDomainTreeDataProvider";
import SubDomainTreeDataProvider from "../providers/SubDomainTreeDataProvider";
import TeamAppTreeDataProvider from "../providers/TeamAppTreeDataProvider";
import UserTreeDataProvider from "../providers/UserTreeDataProvider";
import Command from "./Command";
import DiscloudStatusBarItem from "./DiscloudStatusBarItem";
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
  declare readonly appTree: AppTreeDataProvider;
  declare readonly context: ExtensionContext;
  declare readonly customDomainTree: CustomDomainTreeDataProvider;
  declare readonly statusBar: DiscloudStatusBarItem;
  declare readonly subDomainTree: SubDomainTreeDataProvider;
  declare readonly teamAppTree: TeamAppTreeDataProvider;
  declare readonly userTree: UserTreeDataProvider;
  readonly outputChannels = new Map<string, OutputChannel>();
  readonly logOutputChannels = new Map<string, LogOutputChannel>();
  readonly cache = new Map();
  readonly commands = new Map<string, Command>();
  readonly user = new VSUser();

  constructor() {
    super({ captureRejections: true });
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
    return this.context.secrets;
  }

  get subscriptions() {
    return this.context.subscriptions;
  }

  get token() {
    return this.config.get<string>("token");
  }

  get workspaceAvailable() {
    return Boolean(workspace.workspaceFolders?.length);
  }

  get workspaceFolder() {
    return workspace.workspaceFolders?.find(wf => wf.name === workspace.name)?.uri.fsPath;
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

        let imported;
        try {
          imported = await import(`${join(dir, file.name)}`);
        } catch (error) {
          this.emit("error", error);
          continue;
        }

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

        if (this.debug) logger.info(commandName, disposable ? "✅" : "❌");

        continue;
      }
    }
  }

  async loadEvents(path = join(__dirname, "..", "events")) {
    if (!existsSync(path)) return;

    const files = readdirSync(path, { withFileTypes: true });

    const promises = [];

    for (const file of files)
      if (file.isFile()) {
        if (!file.name.endsWith(fileExt)) continue;

        promises.push(import(`${join(path, file.name)}`));
      }

    await Promise.all(promises);
  }

  loadStatusBar() {
    Object.defineProperty(this, "statusBar", {
      value: new DiscloudStatusBarItem({
        alignment: StatusBarAlignment.Left,
        priority: 40,
        text: t("status.text"),
        tooltip: t("status.tooltip"),
      }),
    });
  }

  async resetStatusBar() {
    this.statusBar.reset();
  }

  activate(context: ExtensionContext) {
    if (!context) return;
    Object.defineProperty(this, "context", { value: context });
    Object.defineProperties(this, {
      appTree: { value: new AppTreeDataProvider("discloud-apps") },
      customDomainTree: { value: new CustomDomainTreeDataProvider("discloud-domains") },
      subDomainTree: { value: new SubDomainTreeDataProvider("discloud-subdomains") },
      teamAppTree: { value: new TeamAppTreeDataProvider("discloud-teams") },
      userTree: { value: new UserTreeDataProvider("discloud-user") },
    });
    this.emit("activate", context);
  }
}

export default Discloud;
