import { DiscloudConfigScopes } from "@discloudapp/api-types/v2";
import { DiscloudConfig } from "@discloudapp/util";
import { t } from "@vscode/l10n";
import { setTimeout as sleep } from "timers/promises";
import { StatusBarAlignment, ThemeColor, type Uri, window, workspace, type WorkspaceFolder } from "vscode";
import type { StatusBarItemOptions } from "../@types";
import type ExtensionCore from "../core";
import { ConfigKeys } from "../utils/constants";
import FileSystem from "../utils/FileSystem";
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
  Loading,
  Limited,
}

const _textCommittingKey = "status.text.committing";
const _textLoadingKey = "status.text.loading";
const _textLoginKey = "status.text.login";
const _textRatelimitedKey = "status.text.ratelimited";
const _textUploadKey = "status.text.upload";
const _textUploadingKey = "status.text.uploading";

const _tooltipLoginKey = "status.tooltip.login";
const _tooltipRatelimitedKey = "status.tooltip.ratelimited";
const _tooltipUploadKey = "status.tooltip.upload";

const _lazyWarningBackgroundColor = lazy(() => new ThemeColor("statusBarItem.warningBackground"));

function defaultOptions(): Partial<StatusBarItemOptions> {
  return {
    alignment: StatusBarAlignment.Left,
    priority: 40,
    text: t("status.text"),
    tooltip: t("status.tooltip"),
  };
}

export default class DiscloudStatusBarItem extends BaseStatusBarItem {
  constructor(readonly core: ExtensionCore, data?: Partial<StatusBarItemOptions>) {
    super(core.context, Object.assign(defaultOptions(), data));

    this.#toggleStatusBarVisibility();

    let lastWorkspaceFolder!: WorkspaceFolder | undefined;
    window.onDidChangeActiveTextEditor(async (editor) => {
      if (this._status !== Status.Regular) return;

      await sleep(100);

      editor ??= window.activeTextEditor;

      if (editor) {
        if (lastWorkspaceFolder?.uri.fsPath === editor.document.uri.fsPath) return;
        lastWorkspaceFolder = workspace.getWorkspaceFolder(editor.document.uri);
        return await this.setDefault(editor.document.uri);
      }

      if (this.#hasWorkspaceAvailable) await this.setDefault();
    }, null, this.context.subscriptions);

    workspace.onDidOpenTextDocument((document) => {
      if (this._status !== Status.Regular) return;
      if (lastWorkspaceFolder?.uri.fsPath === document.uri.fsPath) return;
      lastWorkspaceFolder = workspace.getWorkspaceFolder(document.uri);
      return this.setDefault(document.uri);
    }, null, this.context.subscriptions);

    workspace.onDidChangeWorkspaceFolders((_event) =>
      this.#toggleStatusBarVisibility(), null, this.context.subscriptions);
  }

  declare protected _status: Status;

  get limited() { return this._status === Status.Limited; }

  get loading() { return this._status === Status.Loading; }

  get #hasWorkspaceAvailable() { return Boolean(workspace.workspaceFolders?.length); }

  #toggleStatusBarVisibility() {
    if (this.#hasWorkspaceAvailable) {
      this.show();
    } else {
      this.hide();
    }
  }

  async reset() {
    if (this.limited) return;

    super.reset();

    if (await this.core.auth.hasSession()) {
      this.setDefault();
    } else {
      this.setLogin();
    }
  }

  setCommitting() {
    if (this.limited) return;

    this._status = Status.Acting;

    this.command = undefined;
    this.text = t(_textCommittingKey);
    this.tooltip = undefined;
  }

  protected async _setConfigDefault(uri?: Uri) {
    if (this._status !== Status.Regular) return false;

    const workspaceFolder = await FileSystem.getWorkspaceFolder({ silent: true, uri });

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

    this._status = Status.Loading;

    this.command = undefined;
    this.text = t(_textLoadingKey);
    this.tooltip = undefined;
  }

  setLogin() {
    if (this.limited) return;

    this.command = "discloud.login";
    this.text = t(_textLoginKey);
    this.tooltip = t(_tooltipLoginKey);
  }

  disableRateLimited() {
    this.setRateLimited(false);
  }

  enableRateLimited() {
    this.setRateLimited(true);
  }

  setRateLimited(limited?: boolean) {
    if (typeof limited === "boolean") {
      if (limited) {
        this._status = Status.Limited;
        this.command = undefined;
        this.backgroundColor = _lazyWarningBackgroundColor();
        this.text = t(_textRatelimitedKey);
        this.tooltip = t(_tooltipRatelimitedKey);
      } else {
        this._status = Status.Regular;
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
    this.text = t(_textUploadKey);
    this.tooltip = t(_tooltipUploadKey);
  }

  setUploading() {
    if (this.limited) return;

    this._status = Status.Acting;

    this.command = undefined;
    this.text = t(_textUploadingKey);
    this.tooltip = undefined;
  }
}
