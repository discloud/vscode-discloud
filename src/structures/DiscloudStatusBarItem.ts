import { t } from "@vscode/l10n";
import { DiscloudConfig, DiscloudConfigScopes } from "discloud.app";
import { setTimeout as sleep } from "timers/promises";
import { type ExtensionContext, StatusBarAlignment, ThemeColor, type Uri, window, workspace, type WorkspaceFolder } from "vscode";
import { type StatusBarItemData, type StatusBarItemOptions } from "../@types";
import extension from "../extension";
import { ConfigKeys } from "../util/constants";
import BaseStatusBarItem from "./BaseStatusBarItem";

enum EMOJIS {
  commit = "git-commit",
  logs = "console",
  upload = "cloud-upload"
}

enum Status {
  Regular,
  Acting,
  Limited,
}

export default class DiscloudStatusBarItem extends BaseStatusBarItem {
  static readonly #defaultOptions: Partial<StatusBarItemOptions> = {
    alignment: StatusBarAlignment.Left,
    priority: 40,
    text: t("status.text"),
    tooltip: t("status.tooltip"),
  };

  constructor(readonly context: ExtensionContext, data?: Partial<StatusBarItemOptions>) {
    super(context, Object.assign({}, DiscloudStatusBarItem.#defaultOptions, data));

    if (workspace.workspaceFolders?.length) {
      this.show();
    } else {
      this.hide();
    }

    let lastWorkspaceFolder!: WorkspaceFolder | undefined;
    const disposableChangeActiveTextEditor = window.onDidChangeActiveTextEditor(async (editor) => {
      if (this._status !== Status.Regular) return;

      await sleep(100);

      editor ??= window.activeTextEditor;

      if (editor) {
        if (lastWorkspaceFolder?.uri.fsPath === editor.document.uri.fsPath) return;
        lastWorkspaceFolder = workspace.getWorkspaceFolder(editor.document.uri);
        return await this.setDefault(editor.document.uri);
      }

      const folders = workspace.workspaceFolders;
      if (folders && folders.length > 1) await this.setDefault();
    });

    const disposableOpenTextDocument = workspace.onDidOpenTextDocument((document) => {
      if (this._status !== Status.Regular) return;
      if (lastWorkspaceFolder?.uri.fsPath === document.uri.fsPath) return;
      lastWorkspaceFolder = workspace.getWorkspaceFolder(document.uri);
      return this.setDefault(document.uri);
    });

    const disposableChangeWorkspaceFolders = workspace.onDidChangeWorkspaceFolders(() => {
      if (extension.workspaceAvailable) {
        this.show();
      } else {
        this.hide();
      }
    });

    context.subscriptions.push(
      disposableChangeActiveTextEditor,
      disposableOpenTextDocument,
      disposableChangeWorkspaceFolders,
    );
  }

  protected _status!: Status;

  #maybeLimitedMessage!: string;
  get #limitedMessage() {
    return this.#maybeLimitedMessage ??= t("status.text.ratelimited");
  }

  get limited() {
    return this.text === this.#limitedMessage;
  }

  get loading() {
    return this.data.text.includes("$(loading~spin)");
  }

  get token() {
    return extension.config.get<string>(ConfigKeys.token);
  }

  reset(data: Partial<StatusBarItemData> = this.originalData) {
    if (this.limited) return;

    this._status = Status.Regular;

    super.reset(data);

    if (this.token && extension.api.tokenIsValid) {
      this.setDefault();
    } else {
      this.setLogin();
    }
  }

  setCommitting() {
    if (this.limited) return;

    this._status = Status.Acting;

    this.command = undefined;
    this.text = t("status.text.committing");
    this.tooltip = undefined;
  }

  protected async _findConfigApp() {
    const folders = workspace.workspaceFolders;

    if (!folders?.length || folders.length === 1) return;

    const files = await workspace.findFiles(DiscloudConfig.filename);

    let app;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const fileBuffer = await workspace.fs.readFile(file);

      if (!fileBuffer.length) continue;

      const dConfig = new DiscloudConfig(file.fsPath, fileBuffer.toString());

      const ID = dConfig.get(DiscloudConfigScopes.ID);

      if (!ID) continue;

      app = extension.appTree.children.get(ID) ?? extension.teamAppTree.children.get(ID);

      if (app && (app.label || app.data.name || app.data.description)) break;
    }

    return app;
  }

  protected async _setConfigDefault(uri?: Uri) {
    if (this._status !== Status.Regular) return false;

    const workspaceFolder = await extension.getWorkspaceFolder({ fallbackUserChoice: false, uri });

    if (!workspaceFolder) return false;

    const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

    const ID = dConfig.get(DiscloudConfigScopes.ID);

    if (!ID) return false;

    const app = extension.appTree.children.get(ID) ?? extension.teamAppTree.children.get(ID);

    if (!app) return false;

    if (app.label) {
      if (typeof app.label === "string") {
        this.text = app.label;
      } else {
        this.text = app.label.label;
      }
    }

    if (!this.text) {
      if (app.data.name || app.data.description) {
        this.text = app.data.name || app.data.description!;
      } else {
        return false;
      }
    }

    const behavior = extension.config.get<string>(ConfigKeys.statusBarBehavior);
    const emoji = EMOJIS[<keyof typeof EMOJIS>behavior];

    this.text = `$(${emoji}) ${this.text}`;
    this.command = `discloud.${behavior}`;
    this.tooltip = t(`command.${behavior}`);

    return true;
  }

  async setDefault(uri?: Uri) {
    if (this.limited) return;

    if (await this._setConfigDefault(uri)) return;

    this.setUpload();
  }

  setLoading() {
    if (this.limited) return;

    this._status = Status.Acting;

    this.command = undefined;
    this.text = t("status.text.loading");
    this.tooltip = undefined;
  }

  setLogin() {
    if (this.limited) return;

    this.command = "discloud.login";
    this.text = t("status.text.login");
    this.tooltip = t("status.tooltip.login");
  }

  setRateLimited(limited?: boolean) {
    if (typeof limited === "boolean") {
      if (limited) {
        this._status = Status.Limited;
        this.command = undefined;
        this.backgroundColor = new ThemeColor("statusBarItem.warningBackground");
        this.text = this.#limitedMessage;
        this.tooltip = t("status.tooltip.ratelimited");
      } else {
        this.text = this.originalData.text;
        this.reset();
      }
    } else {
      this.setRateLimited(!this.limited);
    }
  }

  setText(text: string) {
    if (this.limited) return;

    if (typeof text === "string") this.text = text;
  }

  setUpload() {
    if (this.limited) return;

    this.command = "discloud.upload";
    this.text = t("status.text.upload");
    this.tooltip = t("status.tooltip.upload");
  }

  setUploading() {
    if (this.limited) return;

    this._status = Status.Acting;

    this.command = undefined;
    this.text = t("status.text.uploading");
    this.tooltip = undefined;
  }
}
