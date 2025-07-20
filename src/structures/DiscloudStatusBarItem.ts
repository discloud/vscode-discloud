import { DiscloudConfigScopes } from "@discloudapp/api-types/v2";
import { DiscloudConfig } from "@discloudapp/util";
import { t } from "@vscode/l10n";
import { setTimeout as sleep } from "timers/promises";
import { StatusBarAlignment, ThemeColor, type Uri, window, workspace, type WorkspaceFolder } from "vscode";
import { type StatusBarItemData, type StatusBarItemOptions } from "../@types";
import type ExtensionCore from "../core/extension";
import { ConfigKeys } from "../utils/constants";
import lazy from "../utils/lazy";
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

const lazyCommittingMessage = lazy(() => t("status.text.committing"));
const lazyLimitedMessage = lazy(() => t("status.text.ratelimited"));
const lazyLimitedTooltip = lazy(() => t("status.tooltip.ratelimited"));
const lazyLoadingMessage = lazy(() => t("status.text.loading"));
const lazyLoginMessage = lazy(() => t("status.text.login"));
const lazyLoginTooltip = lazy(() => t("status.tooltip.login"));
const lazyUploadMessage = lazy(() => t("status.text.upload"));
const lazyUploadTooltip = lazy(() => t("status.tooltip.upload"));
const lazyUploadingMessage = lazy(() => t("status.text.uploading"));
const lazyWarningBackgroundColor = lazy(() => new ThemeColor("statusBarItem.warningBackground"));

export default class DiscloudStatusBarItem extends BaseStatusBarItem {
  static readonly #defaultOptions: Partial<StatusBarItemOptions> = {
    alignment: StatusBarAlignment.Left,
    priority: 40,
    text: t("status.text"),
    tooltip: t("status.tooltip"),
  };

  constructor(readonly core: ExtensionCore, data?: Partial<StatusBarItemOptions>) {
    super(core.context, Object.assign({}, DiscloudStatusBarItem.#defaultOptions, data));

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
      if (this.core.workspaceAvailable) {
        this.show();
      } else {
        this.hide();
      }
    });

    core.context.subscriptions.push(
      disposableChangeActiveTextEditor,
      disposableOpenTextDocument,
      disposableChangeWorkspaceFolders,
    );
  }

  protected _status!: Status;

  get limited() {
    return this.text === lazyLimitedMessage();
  }

  #loading = "$(loading~spin)";
  get loading() {
    return this.data.text.includes(this.#loading);
  }

  async reset(data: Partial<StatusBarItemData> = this.originalData) {
    if (this.limited) return;

    this._status = Status.Regular;

    super.reset(data);

    if (await this.core.auth.pat.getSession()) {
      this.setDefault();
    } else {
      this.setLogin();
    }
  }

  setCommitting() {
    if (this.limited) return;

    this._status = Status.Acting;

    this.command = undefined;
    this.text = lazyCommittingMessage();
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

      app = this.core.userAppTree.children.get(ID) ?? this.core.teamAppTree.children.get(ID);

      if (app && (app.label || app.data.name || app.data.description)) break;
    }

    return app;
  }

  protected async _setConfigDefault(uri?: Uri) {
    if (this._status !== Status.Regular) return false;

    const workspaceFolder = await this.core.getWorkspaceFolder({ silent: true, uri });

    if (!workspaceFolder) return false;

    const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

    const ID = dConfig.get(DiscloudConfigScopes.ID);

    if (!ID) return false;

    const app = this.core.userAppTree.children.get(ID) ?? this.core.teamAppTree.children.get(ID);

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

    const behavior = this.core.config.get<string>(ConfigKeys.statusBarBehavior);
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
    this.text = lazyLoadingMessage();
    this.tooltip = undefined;
  }

  setLogin() {
    if (this.limited) return;

    this.command = "discloud.login";
    this.text = lazyLoginMessage();
    this.tooltip = lazyLoginTooltip();
  }

  setRateLimited(limited?: boolean) {
    if (typeof limited === "boolean") {
      if (limited) {
        this._status = Status.Limited;
        this.command = undefined;
        this.backgroundColor = lazyWarningBackgroundColor();
        this.text = lazyLimitedMessage();
        this.tooltip = lazyLimitedTooltip();
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
    this.text = lazyUploadMessage();
    this.tooltip = lazyUploadTooltip();
  }

  setUploading() {
    if (this.limited) return;

    this._status = Status.Acting;

    this.command = undefined;
    this.text = lazyUploadingMessage();
    this.tooltip = undefined;
  }
}
