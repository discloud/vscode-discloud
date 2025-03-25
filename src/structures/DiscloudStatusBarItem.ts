import { t } from "@vscode/l10n";
import { DiscloudConfig, DiscloudConfigScopes } from "discloud.app";
import { type ExtensionContext, StatusBarAlignment, ThemeColor, workspace } from "vscode";
import { type StatusBarItemData, type StatusBarItemOptions } from "../@types";
import extension from "../extension";
import { ConfigKeys } from "../util/constants";
import BaseStatusBarItem from "./BaseStatusBarItem";

enum EMOJIS {
  commit = "git-commit",
  logs = "console",
  upload = "cloud-upload"
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
  }

  get limited() {
    return this.text === t("status.text.ratelimited");
  }

  get loading() {
    return this.data.text.includes("$(loading~spin)");
  }

  get token() {
    return extension.config.get<string>(ConfigKeys.token);
  }

  reset(data: Partial<StatusBarItemData> = this.originalData) {
    if (this.limited) return;

    super.reset(data);

    if (this.token && extension.api.tokenIsValid) {
      this.setDefault();
    } else {
      this.setLogin();
    }
  }

  setCommitting() {
    if (this.limited) return;

    this.command = undefined;
    this.text = t("status.text.committing");
    this.tooltip = undefined;
  }

  async setDefault() {
    if (this.limited) return;

    const workspaceFolder = await extension.getWorkspaceFolder();

    if (!workspaceFolder) return this.setUpload();

    const dConfig = new DiscloudConfig(workspaceFolder.fsPath);

    const ID = dConfig.get(DiscloudConfigScopes.ID);

    if (!ID) return this.setUpload();

    const app = extension.appTree.children.get(ID) ??
      extension.teamAppTree.children.get(ID);

    if (!app) return this.setUpload();

    if (typeof app.label === "string") {
      this.text = app.label;
    } else if (app.data.name || app.data.description) {
      this.text = app.data.name || app.data.description!;
    } else {
      return this.setUpload();
    }

    const behavior = extension.config.get<string>(ConfigKeys.statusBarBehavior);
    const emoji = EMOJIS[<keyof typeof EMOJIS>behavior];

    this.text = `$(${emoji}) ${this.text}`;
    this.command = `discloud.${behavior}`;
    this.tooltip = t(`command.${behavior}`);
  }

  setLoading() {
    if (this.limited) return;

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
        this.command = undefined;
        this.backgroundColor = new ThemeColor("statusBarItem.warningBackground");
        this.text = t("status.text.ratelimited");
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

    this.command = undefined;
    this.text = t("status.text.uploading");
    this.tooltip = undefined;
  }
}
