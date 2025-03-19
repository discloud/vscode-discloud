import { t } from "@vscode/l10n";
import { EventEmitter } from "events";
import { existsSync } from "fs";
import { readdir } from "fs/promises";
import { extname, join, normalize } from "path";
import { commands, type Disposable, type ExtensionContext, type LogOutputChannel, type OutputChannel, StatusBarAlignment, type Uri, window, workspace } from "vscode";
import { type Events, type TaskData } from "../@types";
import AppTreeDataProvider from "../providers/AppTreeDataProvider";
import CustomDomainTreeDataProvider from "../providers/CustomDomainTreeDataProvider";
import SubDomainTreeDataProvider from "../providers/SubDomainTreeDataProvider";
import TeamAppTreeDataProvider from "../providers/TeamAppTreeDataProvider";
import UserTreeDataProvider from "../providers/UserTreeDataProvider";
import REST from "../services/discloud/REST";
import { UserAgent } from "../services/discloud/UserAgent";
import { NODE_MODULES_EXTENSIONS } from "../util/constants";
import { removeFileExtension } from "../util/utils";
import type Command from "./Command";
import DiscloudStatusBarItem from "./DiscloudStatusBarItem";
import VSUser from "./VSUser";

export default class Discloud extends EventEmitter<Events> implements Disposable {
  declare readonly api: REST;
  declare readonly context: ExtensionContext;
  declare readonly logger: LogOutputChannel;
  declare readonly statusBar: DiscloudStatusBarItem;
  declare readonly appTree: AppTreeDataProvider;
  declare readonly customDomainTree: CustomDomainTreeDataProvider;
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

  get token() {
    return this.config.get<string>("token");
  }

  get workspaceAvailable() {
    return Boolean(workspace.workspaceFolders?.length);
  }

  get workspaceFolderUri() {
    const folders = workspace.workspaceFolders;

    if (!folders?.length) return;

    if (folders.length > 1) {
      const name = workspace.name;

      if (name) return folders
        .find(wf => name === wf.name || name.startsWith(wf.name) || name.endsWith(wf.name))?.uri ?? folders[0].uri;

      return folders[0].uri;
    }

    return folders[0].uri;
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
      .reduce<string[]>((acc, config) => {
        const data = this.config.get<string>(config);
        if (data !== undefined) acc.push(normalize(data));
        return acc;
      }, [])
      .filter(Boolean)
      .concat("discloud", `${workspace.name}.zip`);
  }

  debug(...args: Parameters<LogOutputChannel["debug"]>) {
    this.emit("debug", ...args);
  }

  async getFolderDialog(task?: TaskData | null, title?: string, openLabel?: string) {
    task?.progress.report({ increment: -1, message: t("folder.get.one") });

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

  getWorkspaceFolder(uri?: Uri): Promise<Uri | undefined>
  async getWorkspaceFolder(uri?: Uri) {
    if (uri) return workspace.getWorkspaceFolder(uri)?.uri ?? this.getWorkspaceFolder();
    const [workspaceFile] = await workspace.findFiles("*", null, 1);
    if (workspaceFile) return workspace.getWorkspaceFolder(workspaceFile)?.uri ?? this.workspaceFolderUri;
    return this.workspaceFolderUri;
  }

  async loadCommands(dir = join(__dirname, "..", "commands")) {
    if (!existsSync(dir)) return;

    const files = await readdir(dir, { recursive: true });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!NODE_MODULES_EXTENSIONS.has(extname(file))) continue;

      const filePath = join(dir, file);

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

      const commandName = removeFileExtension(join("discloud", file)).replace(/[/\\]+/g, ".");

      if (!command || typeof command !== "object" || !Reflect.has(command, "data") || !Reflect.has(command, "run")) {
        this.debug(commandName, "❌");
        continue;
      }

      const disposable = commands.registerCommand(commandName, async (...args) => {
        if (!command.data.allowTokenless)
          if (!this.hasToken) return;

        try {
          if (command.data.progress) {
            const taskData = <TaskData>{};

            await window.withProgress(command.data.progress, async (progress, token) => {
              token.onCancellationRequested(() => this.statusBar.reset());

              taskData.progress = progress;
              taskData.token = token;

              await command.run(taskData, ...args);
            });
          } else {
            await command.run(null, ...args);
          }
        } catch (error) {
          this.emit("error", error);
        } finally {
          this.statusBar.reset();
        }
      });

      this.context.subscriptions.push(disposable);

      this.commands.set(commandName, command);

      this.debug(commandName, "✅");
    }

    this.debug("Commands loaded:", this.commands.size);
  }

  async loadEvents(path = join(__dirname, "..", "events")) {
    if (!existsSync(path)) return;

    const promises = [];

    const files = await readdir(path, { recursive: true });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (NODE_MODULES_EXTENSIONS.has(extname(file)))
        promises.push(import(`${join(path, file)}`));
    }

    await Promise.all(promises);

    this.debug("Events loaded:", promises.length);
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

  async activate(context: ExtensionContext) {
    if (!context) return;

    Object.defineProperty(this, "context", { value: context });

    Object.defineProperty(this, "logger", { value: this.getLogOutputChannel("Discloud") });

    this.logger.info("Activate: begin");

    const version = context.extension.packageJSON.version;

    const userAgent = new UserAgent(version);

    await this.loadEvents();

    Object.defineProperties(this, {
      // @ts-expect-error ts(2345) `this`
      api: { value: new REST(this, { userAgent }) },
      appTree: { value: new AppTreeDataProvider(context) },
      customDomainTree: { value: new CustomDomainTreeDataProvider(context) },
      subDomainTree: { value: new SubDomainTreeDataProvider(context) },
      teamAppTree: { value: new TeamAppTreeDataProvider(context) },
      userTree: { value: new UserTreeDataProvider(context) },
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
