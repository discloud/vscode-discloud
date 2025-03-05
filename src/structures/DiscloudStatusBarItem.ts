import { t } from "@vscode/l10n";
import { DiscloudConfig } from "discloud.app";
import { ThemeColor, workspace } from "vscode";
import { type StatusBarItemData, type StatusBarItemOptions } from "../@types";
import extension from "../extension";
import BaseStatusBarItem from "./BaseStatusBarItem";

enum EMOJIS {
  commit = "git-commit",
  logs = "console",
  upload = "cloud-upload"
}

export default class DiscloudStatusBarItem extends BaseStatusBarItem {
  constructor(data: Partial<StatusBarItemOptions>) {
    super(data);

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
    return extension.config.get<string>("token");
  }

  reset(data: Partial<StatusBarItemData> = this.originalData) {
    if (this.limited) return;

    super.reset(data);

    if (this.token && extension.rest.tokenIsValid) {
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
    queueMicrotask(() => dConfig.dispose());

    if (!dConfig.data.ID) return this.setUpload();

    const app = extension.appTree.children.get(dConfig.data.ID) ??
      extension.teamAppTree.children.get(dConfig.data.ID);

    if (!app) return this.setUpload();

    if (typeof app.label === "string") {
      this.text = app.label;
    } else if (app.data.name || app.data.description) {
      this.text = app.data.name || app.data.description!;
    } else {
      return this.setUpload();
    }

    const behavior = extension.config.get<string>("status.bar.behavior");
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
