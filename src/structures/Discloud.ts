import { t } from "@vscode/l10n";
import { EventEmitter } from "events";
import { normalize } from "path";
import { type Disposable, type ExtensionContext, type LogOutputChannel, type OutputChannel, type Uri, window, workspace } from "vscode";
import { type Events, type TaskData } from "../@types";
import { commandsRegister } from "../commands";
import { loadEvents } from "../events";
import AppTreeDataProvider from "../providers/AppTreeDataProvider";
import CustomDomainTreeDataProvider from "../providers/CustomDomainTreeDataProvider";
import SubDomainTreeDataProvider from "../providers/SubDomainTreeDataProvider";
import TeamAppTreeDataProvider from "../providers/TeamAppTreeDataProvider";
import UserTreeDataProvider from "../providers/UserTreeDataProvider";
import REST from "../services/discloud/REST";
import { UserAgent } from "../services/discloud/UserAgent";
import { ConfigKeys } from "../util/constants";
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
    return Boolean(this.config.get<boolean>(ConfigKeys.debug));
  }

  get token() {
    return this.config.get<string>(ConfigKeys.token);
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
      ConfigKeys.appBackupDir,
      ConfigKeys.appImportDir,
      ConfigKeys.appBackupDir,
      ConfigKeys.appImportDir,
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

  setContext(context: ExtensionContext) {
    Object.defineProperty(this, "context", { value: context });
  }

  #loadLogger() {
    Object.defineProperty(this, "logger", { value: this.getLogOutputChannel("Discloud") });
  }

  #loadStatusBar(context: ExtensionContext = this.context) {
    Object.defineProperty(this, "statusBar", { value: new DiscloudStatusBarItem(context) });
  }

  #loadTreeViews(context: ExtensionContext = this.context) {
    Object.defineProperties(this, {
      appTree: { value: new AppTreeDataProvider(context) },
      customDomainTree: { value: new CustomDomainTreeDataProvider(context) },
      subDomainTree: { value: new SubDomainTreeDataProvider(context) },
      teamAppTree: { value: new TeamAppTreeDataProvider(context) },
      userTree: { value: new UserTreeDataProvider(context) },
    });
  }

  async activate(context: ExtensionContext = this.context) {
    if (!this.context) this.setContext(context);

    this.#loadLogger();

    this.logger.info("Activate: begin");

    this.#loadStatusBar();
    this.statusBar.setLoading();

    const version = context.extension.packageJSON.version;

    const userAgent = new UserAgent(version);

    Object.defineProperties(this, {
      // @ts-expect-error ts(2345) `this`
      api: { value: new REST(this, { userAgent }) },
    });

    await loadEvents(this);
    await commandsRegister(this);

    this.#loadTreeViews();

    this.emit("activate", context);
  }

  dispose() {
    this.removeAllListeners();
    this.outputChannels.clear();
    this.logOutputChannels.clear();
    this.commands.clear();
  }
}
