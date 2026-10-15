import { DiscloudConfigScopes } from "@discloudapp/api-types/v2";
import { DiscloudConfig, type ModPermissionsResolvable } from "@discloudapp/util";
import { t } from "@vscode/l10n";
import { window, type CancellationToken, type IconPath, type QuickPickItem, type Uri } from "vscode";
import type { VscodeProgressReporter } from "../@types";
import type ExtensionCore from "../core";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";
import type UserAppTreeItem from "../structures/UserAppTreeItem";
import FileSystem from "../utils/FileSystem";

interface AppPickerOptions {
  allowOtherAppTypes?: boolean
  noCached?: boolean
  progress?: VscodeProgressReporter
  requiredModPermissions?: ModPermissionsResolvable
  throwOnCancel?: boolean
  token?: CancellationToken
  uri?: Uri
}

export default class AppPicker {
  constructor(
    protected readonly core: ExtensionCore,
  ) { }

  async #getWorkspaceConfig(options: AppPickerOptions = {}) {
    const workspaceFolder = await FileSystem.getWorkspaceFolder({
      allowReadSelectedPath: false,
      silent: true,
      token: options.token,
      uri: options.uri,
    });

    if (workspaceFolder) return await DiscloudConfig.fromPath(workspaceFolder.fsPath);
  }

  async #getWorkspaceConfigId(options: AppPickerOptions = {}) {
    const dConfig = await this.#getWorkspaceConfig(options);
    return dConfig?.get(DiscloudConfigScopes.ID);
  }

  pickApp(options?: AppPickerOptions & { allowOtherAppTypes: false }): Promise<never>
  pickApp(options?: AppPickerOptions & { throwOnCancel: true }): Promise<UserAppTreeItem | TeamAppTreeItem>
  pickApp(options?: AppPickerOptions): Promise<UserAppTreeItem | TeamAppTreeItem | undefined>
  async pickApp(options: AppPickerOptions = {}) {
    options.progress?.report({ increment: -1, message: t("choose.app") });

    const ID = await this.#getWorkspaceConfigId(options);

    if (ID) {
      if (this.core.userAppTree.children.has(ID)) return this.pickUserApp(options);
      if (this.core.teamAppTree.children.has(ID)) return this.pickTeamApp(options);
    }

    return this.pickUserApp(options);
  }

  pickUserApp(options?: AppPickerOptions & { throwOnCancel: true }): Promise<UserAppTreeItem>
  pickUserApp(options?: AppPickerOptions & { allowOtherAppTypes: true, throwOnCancel: true }): Promise<UserAppTreeItem | TeamAppTreeItem>
  pickUserApp(options?: AppPickerOptions & { allowOtherAppTypes: true }): Promise<UserAppTreeItem | TeamAppTreeItem | undefined>
  pickUserApp(options?: AppPickerOptions): Promise<UserAppTreeItem | undefined>
  async pickUserApp(options: AppPickerOptions = {}) {
    const ID = await this.#getWorkspaceConfigId(options);

    let alreadyFetched = false;
    if (options.noCached) {
      await this.core.userAppTree.fetch(true);
      options.noCached = false;
      alreadyFetched = true;
    }

    const apps: QuickPickItem[] = [];

    for (const app of this.core.userAppTree.children.values()) {
      apps.push({
        description: app.appId,
        iconPath: app.iconPath as Uri,
        label: [
          app.data.name,
          app.online ? t("online") : t("offline"),
        ].join(" - "),
      });
    }

    const teamAppsSize = this.core.teamAppTree.size;

    if (!apps.length) {
      if (!alreadyFetched && !options.noCached) {
        options.noCached = true;
        return this.pickUserApp(options);
      }

      if (!options.allowOtherAppTypes || !teamAppsSize)
        throw new Error(t("no.apps.found.to.choose"));

      return this.pickTeamApp(options);
    }

    let hasApp = false;
    if (ID) {
      const pickedAppIndex = apps.findIndex(app => app.description === ID);

      hasApp = pickedAppIndex !== -1;

      if (hasApp) {
        apps[pickedAppIndex].picked = true;

        if (apps.length > 1) [apps[0], apps[pickedAppIndex]] = [apps[pickedAppIndex], apps[0]];
      }
    }

    const moreAppsLabel = t("n.more", { n: apps.length - 1 });
    const seeOtherAppTypesLabel = t("see.also.your.n.team.apps", { n: teamAppsSize });

    const items = Array.from(apps);

    if (hasApp && apps.length > 1) items.splice(1, items.length, { label: moreAppsLabel });

    if (options.allowOtherAppTypes && teamAppsSize) items.push({ label: seeOtherAppTypesLabel });

    let picked: QuickPickItem | undefined;
    do {
      picked = await window.showQuickPick(items, { canPickMany: false }, options.token);

      if (!picked) break;

      switch (picked.label) {
        case moreAppsLabel:
          items.splice(0, items.length, ...apps);
          break;
        case seeOtherAppTypesLabel:
          return this.pickTeamApp(options);
      }
    } while (!picked);

    if (!picked) {
      if (options.throwOnCancel)
        throw Error(t("missing.appid"));

      return;
    }

    const pickedID = picked.description!;

    return this.core.userAppTree.children.get(pickedID);
  }

  pickTeamApp(options?: AppPickerOptions & { throwOnCancel: true }): Promise<TeamAppTreeItem>
  pickTeamApp(options?: AppPickerOptions & { allowOtherAppTypes: true, throwOnCancel: true }): Promise<UserAppTreeItem | TeamAppTreeItem>
  pickTeamApp(options?: AppPickerOptions & { allowOtherAppTypes: true }): Promise<UserAppTreeItem | TeamAppTreeItem | undefined>
  pickTeamApp(options?: AppPickerOptions): Promise<TeamAppTreeItem | undefined>
  async pickTeamApp(options: AppPickerOptions = {}) {
    const ID = await this.#getWorkspaceConfigId(options);

    let alreadyFetched = false;
    if (options.noCached) {
      await this.core.teamAppTree.fetch(true);
      options.noCached = false;
      alreadyFetched = true;
    }

    const apps: QuickPickItem[] = [];

    for (const app of this.core.teamAppTree.children.values()) {
      if (options.requiredModPermissions !== undefined && !app.permissions.has(options.requiredModPermissions)) continue;

      apps.push({
        description: app.appId,
        iconPath: app.iconPath as IconPath,
        label: [
          app.data.name,
          app.online ? t("online") : t("offline"),
        ].join(" - "),
      });
    }

    const userAppsSize = this.core.userAppTree.size;

    if (!apps.length) {
      if (!alreadyFetched && !options.noCached) {
        options.noCached = true;
        return this.pickTeamApp(options);
      }

      if (!options.allowOtherAppTypes || !userAppsSize)
        throw new Error(t("no.apps.found.to.choose"));

      return this.pickUserApp(options);
    }

    let hasApp = false;
    if (ID) {
      const pickedAppIndex = apps.findIndex(app => app.description === ID);

      hasApp = pickedAppIndex !== -1;

      if (hasApp) {
        apps[pickedAppIndex].picked = true;

        if (apps.length > 1) [apps[0], apps[pickedAppIndex]] = [apps[pickedAppIndex], apps[0]];
      }
    }

    const moreAppsLabel = t("n.more", { n: apps.length - 1 });
    const seeOtherAppTypesLabel = t("see.also.your.n.apps", { n: userAppsSize });

    const items = Array.from(apps);

    if (hasApp && apps.length > 1) items.splice(1, items.length, { label: moreAppsLabel });

    if (options.allowOtherAppTypes && userAppsSize) items.push({ label: seeOtherAppTypesLabel });

    let picked: QuickPickItem | undefined;
    do {
      picked = await window.showQuickPick(items, { canPickMany: false }, options.token);

      if (!picked) break;

      switch (picked.label) {
        case moreAppsLabel:
          items.splice(0, items.length, ...apps);
          break;
        case seeOtherAppTypesLabel:
          return this.pickUserApp(options);
      }
    } while (!picked);

    if (!picked) {
      if (options.throwOnCancel)
        throw Error(t("missing.appid"));

      return;
    }

    const pickedID = picked.description!;

    return this.core.teamAppTree.children.get(pickedID);
  }
}
