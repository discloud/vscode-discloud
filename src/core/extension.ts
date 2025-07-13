import { t } from "@vscode/l10n";
import { EventEmitter } from "events";
import { normalize } from "path";
import { type Disposable, type ExtensionContext, type LogOutputChannel, type OutputChannel, Uri, window, workspace } from "vscode";
import { type Events, type GetWorkspaceFolderOptions, type TaskData } from "../@types";
import { commandsRegister } from "../commands";
import { loadEvents } from "../events";
import SecretStorage from "../modules/storage/SecretStorage";
import AppTreeDataProvider from "../providers/AppTreeDataProvider";
import CustomDomainTreeDataProvider from "../providers/CustomDomainTreeDataProvider";
import SubDomainTreeDataProvider from "../providers/SubDomainTreeDataProvider";
import TeamAppTreeDataProvider from "../providers/TeamAppTreeDataProvider";
import UserTreeDataProvider from "../providers/UserTreeDataProvider";
import REST from "../services/discloud/REST";
import { UserAgent } from "../services/discloud/UserAgent";
import type Command from "../structures/Command";
import DiscloudStatusBarItem from "../structures/DiscloudStatusBarItem";
import VSUser from "../structures/VSUser";
import { ConfigKeys } from "../utils/constants";
import FileSystem from "../utils/FileSystem";

export default class ExtensionCore extends EventEmitter<Events> implements Disposable {
  constructor() {
    super({ captureRejections: true });
  }

  declare readonly api: REST;
  declare readonly context: ExtensionContext;
  declare readonly secrets: SecretStorage;

  declare readonly statusBar: DiscloudStatusBarItem;

  declare readonly appTree: AppTreeDataProvider;
  declare readonly customDomainTree: CustomDomainTreeDataProvider;
  declare readonly subDomainTree: SubDomainTreeDataProvider;
  declare readonly teamAppTree: TeamAppTreeDataProvider;
  declare readonly userTree: UserTreeDataProvider;

  readonly commands = new Map<string, Command>();
  readonly logOutputChannels = new Map<string, LogOutputChannel>();
  readonly outputChannels = new Map<string, OutputChannel>();
  readonly user = new VSUser();

  get config() {
    return workspace.getConfiguration("discloud");
  }

  get isDebug() {
    return Boolean(this.config.get<boolean>(ConfigKeys.debug));
  }

  get logger() {
    return this.getLogOutputChannel("Discloud");
  }

  get singleWorkspaceFolder() {
    const folders = workspace.workspaceFolders;
    if (folders?.length === 1) return folders[0].uri;
  }

  get workspaceAvailable() {
    return Boolean(workspace.workspaceFolders?.length);
  }

  get workspaceIgnoreList() {
    return [
      ConfigKeys.appBackupDir,
      ConfigKeys.appImportDir,
      ConfigKeys.teamBackupDir,
      ConfigKeys.teamImportDir,
    ]
      .reduce<string[]>((acc, config) => {
        const data = this.config.get<string>(config);
        if (data) acc.push(normalize(data));
        return acc;
      }, [])
      .filter(Boolean)
      .concat("discloud", `${workspace.name}.zip`);
  }

  debug(...args: Parameters<LogOutputChannel["debug"]>) {
    this.emit("debug", ...args);
  }

  dispose() {
    this.removeAllListeners();
    this.commands.clear();
    this.logOutputChannels.clear();
    this.outputChannels.clear();
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

  protected _createLogOutputChannel(name: string) {
    const output = window.createOutputChannel(name, { log: true });
    this.context.subscriptions.push(output);
    this.logOutputChannels.set(name, output);
    return output;
  }

  getLogOutputChannel(name: string) {
    return this.logOutputChannels.get(name) ?? this._createLogOutputChannel(name);
  }

  protected _createOutputChannel(key: string) {
    const output = window.createOutputChannel(key);
    this.context.subscriptions.push(output);
    this.outputChannels.set(key, output);
    return output;
  }

  getOutputChannel(name: string, languageId?: string) {
    const key = `${name}${languageId}`;
    return this.outputChannels.get(key) ?? this._createOutputChannel(key);
  }

  async getWorkspaceFolder(options?: GetWorkspaceFolderOptions | null): Promise<Uri | undefined> {
    options ??= {};

    if (options.uri instanceof Uri) {
      const folder = workspace.getWorkspaceFolder(options.uri);
      if (folder) return folder.uri;
    }

    const folders = workspace.workspaceFolders;
    if (!folders?.length) return;
    if (folders.length === 1) return folders[0].uri;

    options.allowReadSelectedPath ??= true;

    if (options.allowReadSelectedPath) {
      const [filePath] = await FileSystem.readSelectedPath(false);
      if (filePath && filePath !== ".")
        return workspace.getWorkspaceFolder(Uri.file(filePath))?.uri;
    }

    options.fallbackUserChoice ??= true;

    if (options.fallbackUserChoice) {
      const picked = await window.showWorkspaceFolderPick();
      if (!picked) return;
      return picked.uri;
    }
  }

  setContext(context: ExtensionContext) {
    Object.defineProperties(this, { context: { value: context } });
  }

  #loadSecretStorage(context: ExtensionContext = this.context) {
    Object.defineProperties(this, { secrets: { value: new SecretStorage(context.secrets) } });

    this.context.subscriptions.push(this.secrets);
  }

  #loadStatusBar() {
    Object.defineProperties(this, { statusBar: { value: new DiscloudStatusBarItem(this) } });
  }

  #loadTreeViews(context: ExtensionContext = this.context) {
    Object.defineProperties(this, {
      appTree: { value: new AppTreeDataProvider(this) },
      customDomainTree: { value: new CustomDomainTreeDataProvider(context) },
      subDomainTree: { value: new SubDomainTreeDataProvider(context) },
      teamAppTree: { value: new TeamAppTreeDataProvider(this) },
      userTree: { value: new UserTreeDataProvider(context) },
    });
  }

  async activate(context: ExtensionContext = this.context) {
    if (!this.context) this.setContext(context);

    this.logger.info("Activate: begin");

    this.#loadSecretStorage();

    this.#loadStatusBar();
    this.statusBar.setLoading();

    const version = context.extension.packageJSON.version;

    const userAgent = new UserAgent(version);

    Object.defineProperties(this, { api: { value: new REST(this, { userAgent }) } });

    await loadEvents(this);
    await commandsRegister(this);

    this.#loadTreeViews();

    this.emit("activate", context);
  }
}
