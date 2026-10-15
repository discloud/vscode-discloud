import { EventEmitter } from "events";
import { normalize } from "path";
import { commands, type Disposable, type ExtensionContext, type LogOutputChannel, type SecretStorage, workspace } from "vscode";
import { type ExtensionContextId } from "./@enum";
import type { Events, IGlobalStateStorage } from "./@types";
import DiscloudAuthenticationProvider from "./authentication/provider";
import { commandsRegister } from "./commands";
import { loadEvents } from "./events";
import DiscloudLogOutputChannel from "./output/LogOutputChannel";
import DiscloudOutputChannel from "./output/OutputChannel";
import CustomDomainTreeDataProvider from "./providers/CustomDomainTreeDataProvider";
import SubDomainTreeDataProvider from "./providers/SubDomainTreeDataProvider";
import TeamAppTreeDataProvider from "./providers/TeamAppTreeDataProvider";
import UserAppTreeDataProvider from "./providers/UserAppTreeDataProvider";
import UserTreeDataProvider from "./providers/UserTreeDataProvider";
import DiscloudApi from "./services/discloud/api";
import GlobalStateStorage from "./storage/globalState";
import SecretStorageImpl from "./storage/secrets";
import StateStorage from "./storage/state";
import DiscloudStatusBarItem from "./structures/DiscloudStatusBarItem";
import TimerMap from "./structures/TimerMap";
import VSUser from "./structures/VSUser";
import { ConfigKeys } from "./utils/constants";

const _workspaceIgnoreConfigKeys = Object.freeze([
  ConfigKeys.appBackupDir,
  ConfigKeys.appImportDir,
  ConfigKeys.teamBackupDir,
  ConfigKeys.teamImportDir,
]);

export default class ExtensionCore extends EventEmitter<Events> implements Disposable {
  constructor(readonly context: ExtensionContext) {
    super({ captureRejections: true });

    context.subscriptions.push(this);

    this.timers = new TimerMap();
    this.user = new VSUser(this);

    this.globalStorage = new GlobalStateStorage(context.globalState);
    this.workspaceStorage = new StateStorage(context.workspaceState);
    this.secrets = new SecretStorageImpl(context.secrets);

    this.auth = new DiscloudAuthenticationProvider(this);

    this.statusBar = new DiscloudStatusBarItem(this);

    this.api = new DiscloudApi(this);

    this.customDomainTree = new CustomDomainTreeDataProvider(this);
    this.subDomainTree = new SubDomainTreeDataProvider(this);
    this.teamAppTree = new TeamAppTreeDataProvider(this);
    this.userAppTree = new UserAppTreeDataProvider(this);
    this.userTree = new UserTreeDataProvider(this);
  }

  readonly auth: DiscloudAuthenticationProvider;
  readonly secrets: SecretStorage;
  readonly globalStorage: StateStorage & IGlobalStateStorage;
  readonly workspaceStorage: StateStorage;

  readonly api: DiscloudApi;

  readonly statusBar: DiscloudStatusBarItem;

  readonly customDomainTree: CustomDomainTreeDataProvider;
  readonly subDomainTree: SubDomainTreeDataProvider;
  readonly teamAppTree: TeamAppTreeDataProvider;
  readonly userAppTree: UserAppTreeDataProvider;
  readonly userTree: UserTreeDataProvider;

  readonly timers: TimerMap;
  readonly user: VSUser;

  get config() {
    return workspace.getConfiguration("discloud");
  }

  get isDebug() {
    return Boolean(this.config.get<boolean>(ConfigKeys.debug));
  }

  get logger() {
    return this.getLogOutputChannel("Discloud");
  }

  get workspaceIgnoreList() {
    const config = this.config;
    return _workspaceIgnoreConfigKeys
      .reduce<string[]>((acc, configName) => {
        const data = config.get<string>(configName);
        if (data) return acc.concat(normalize(data));
        return acc;
      }, [])
      .concat("discloud", `${workspace.name}.zip`);
  }

  async setContext(contextId: ExtensionContextId, ...values: any[]) {
    await commands.executeCommand("setContext", contextId, ...values);
  }

  debug(...args: Parameters<LogOutputChannel["debug"]>) {
    this.emit("debug", this, ...args);
  }

  dispose() {
    this.removeAllListeners();
    this.timers.dispose();
  }

  getLogOutputChannel(name: string) {
    return DiscloudLogOutputChannel.getInstance(this.context, name);
  }

  getOutputChannel(name: string) {
    return DiscloudOutputChannel.getInstance(this.context, name);
  }

  async activate() {
    this.logger.debug("Activate: begin");

    this.statusBar.setLoading();

    await loadEvents(this);
    await commandsRegister(this);

    this.emit("activate", this, this.context);
  }
}
