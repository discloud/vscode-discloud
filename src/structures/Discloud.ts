import { t } from "@vscode/l10n";
import { EventEmitter } from "events";
import { existsSync, readdirSync } from "fs";
import { join, relative } from "path";
import { commands, type ExtensionContext, type LogOutputChannel, type OutputChannel, StatusBarAlignment, window, workspace } from "vscode";
import { type Events, type TaskData } from "../@types";
import { logger } from "../extension";
import AppTreeDataProvider from "../providers/AppTreeDataProvider";
import CustomDomainTreeDataProvider from "../providers/CustomDomainTreeDataProvider";
import SubDomainTreeDataProvider from "../providers/SubDomainTreeDataProvider";
import TeamAppTreeDataProvider from "../providers/TeamAppTreeDataProvider";
import UserTreeDataProvider from "../providers/UserTreeDataProvider";
import { FILE_EXT, replaceFileExtension } from "../util";
import type Command from "./Command";
import DiscloudStatusBarItem from "./DiscloudStatusBarItem";
import VSUser from "./VSUser";

export default class Discloud extends EventEmitter<Events> {
  declare readonly appTree: AppTreeDataProvider;
  declare readonly context: ExtensionContext;
  declare readonly customDomainTree: CustomDomainTreeDataProvider;
  declare readonly statusBar: DiscloudStatusBarItem;
  declare readonly subDomainTree: SubDomainTreeDataProvider;
  declare readonly teamAppTree: TeamAppTreeDataProvider;
  declare readonly userTree: UserTreeDataProvider;
  readonly outputChannels = new Map<string, OutputChannel>();
  readonly logOutputChannels = new Map<string, LogOutputChannel>();
  readonly commands = new Map<string, Command>();
  readonly user = new VSUser();

  constructor() {
    super({ captureRejections: true });
  }

  get config() {
    return workspace.getConfiguration("discloud");
  }

  get hasToken() {
    if (this.token) return true;
    window.showErrorMessage(t("missing.token"));
    return false;
  }

  get isDebug() {
    return Boolean(this.config.get<boolean>("debug"));
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

  get workspaceFolderUri() {
    const folders = workspace.workspaceFolders;
    if (folders?.length) {
      if (folders.length > 1) {
        const name = workspace.name;
        if (name) {
          return folders.find(wf => name === wf.name || name.startsWith(wf.name) || name.endsWith(wf.name))?.uri
            ?? folders[0].uri;
        } else {
          return folders[0].uri;
        }
      } else {
        return folders[0].uri;
      }
    }
  }

  get workspaceFolder() {
    return this.workspaceFolderUri?.fsPath;
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

  debug(...args: Parameters<LogOutputChannel["info"]>) {
    this.emit("debug", ...args);
  }

  async getFolderDialog(task?: TaskData | null, title?: string, openLabel?: string) {
    task?.progress.report({ message: t("folder.get.one") });

    const uris = await window.showOpenDialog({
      canSelectFolders: true,
      title,
      openLabel,
    });

    if (uris?.length) task?.progress.report({ message: t("folder.selected") });

    return uris?.at(0);
  }

  getLogOutputChannel(name: string) {
    let output = this.logOutputChannels.get(name);
    if (output) return output;
    output = window.createOutputChannel(name, { log: true });
    this.context.subscriptions.push(output);
    this.logOutputChannels.set(name, output);
    return output;
  }

  getOutputChannel(name: string, languageId?: string) {
    let output = this.outputChannels.get(`${name}${languageId}`);
    if (output) return output;
    output = window.createOutputChannel(name, languageId);
    this.context.subscriptions.push(output);
    this.outputChannels.set(`${name}${languageId}`, output);
    return output;
  }

  async getWorkspaceFolder() {
    const [workspaceFile] = await workspace.findFiles("*", null, 1);
    if (workspaceFile) return workspace.getWorkspaceFolder(workspaceFile)?.uri ?? this.workspaceFolderUri;
    return this.workspaceFolderUri;
  }

  async loadCommands(dir = join(__dirname, "..", "commands")) {
    if (!existsSync(dir)) return;

    for (const file of readdirSync(dir, { withFileTypes: true, recursive: true })) {
      if (!file.isFile() || !file.name.endsWith(FILE_EXT)) continue;

      const filePath = join(file.parentPath, file.name);

      let imported;
      try {
        imported = await import(filePath);
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

      const commandName = replaceFileExtension(join("discloud", relative(dir, filePath))).replace(/[/\\]+/g, ".");

      const disposable = commands.registerCommand(commandName, async (...args) => {
        if (!command.data.allowTokenless)
          if (!this.hasToken) return;

        try {
          if (command.data.progress) {
            const taskData = <TaskData>{};

            await window.withProgress(command.data.progress, async (progress, token) => {
              token.onCancellationRequested(() => this.resetStatusBar());

              taskData.progress = progress;
              taskData.token = token;

              return await command.run(taskData, ...args);
            });
          } else {
            return await command.run(null, ...args);
          }
        } catch (error) {
          this.emit("error", error);
        } finally {
          this.resetStatusBar();
        }
      });

      this.context.subscriptions.push(disposable);

      this.commands.set(commandName, command);

      if (this.isDebug) logger.info(commandName, disposable ? "✅" : "❌");
    }
  }

  async loadEvents(path = join(__dirname, "..", "events")) {
    if (!existsSync(path)) return;

    const promises = [];

    for (const file of readdirSync(path, { withFileTypes: true, recursive: true }))
      if (file.isFile() && file.name.endsWith(FILE_EXT))
        promises.push(import(`${join(path, file.name)}`));

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

    this.context.subscriptions.push(this.statusBar);
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

  dispose() {
    this.removeAllListeners();
    this.outputChannels.clear();
    this.logOutputChannels.clear();
    this.commands.clear();
  }
}
