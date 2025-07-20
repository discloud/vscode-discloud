import { DiscloudConfigScopes } from "@discloudapp/api-types/v2";
import { DiscloudConfig, ModPermissionsFlags } from "@discloudapp/util";
import { t } from "@vscode/l10n";
import { window, type CancellationToken, type QuickPickItem, type Uri } from "vscode";
import type { VscodeProgressReporter } from "../@types";
import type ExtensionCore from "../core/extension";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";
import type UserAppTreeItem from "../structures/UserAppTreeItem";

interface AppPickerOptions {
  allowOtherAppTypes?: boolean
  noCached?: boolean
  progress?: VscodeProgressReporter
  throwOnCancel?: boolean
  token?: CancellationToken
  uri?: Uri
}

export function pickApp(core: ExtensionCore, options?: AppPickerOptions & { allowOtherAppTypes: false }): Promise<never>
export function pickApp(core: ExtensionCore, options?: AppPickerOptions & { throwOnCancel: true }): Promise<UserAppTreeItem | TeamAppTreeItem>
export function pickApp(core: ExtensionCore, options?: AppPickerOptions): Promise<UserAppTreeItem | TeamAppTreeItem | undefined>
export async function pickApp(core: ExtensionCore, options: AppPickerOptions = {}) {
  options.progress?.report({ increment: -1, message: t("choose.app") });

  options.allowOtherAppTypes = true;

  const workspaceFolder = await core.getWorkspaceFolder({
    allowReadSelectedPath: false,
    fallbackUserChoice: false,
    token: options.token,
    uri: options.uri,
  });

  if (workspaceFolder) {
    const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

    const ID = dConfig.get(DiscloudConfigScopes.ID);

    if (ID) {
      if (core.userAppTree.children.has(ID)) return pickUserApp(core, options);
      if (core.teamAppTree.children.has(ID)) return pickTeamApp(core, options);
    }
  }

  return pickUserApp(core, options);
}

export function pickUserApp(core: ExtensionCore, options?: AppPickerOptions & { throwOnCancel: true }): Promise<UserAppTreeItem>
export function pickUserApp(core: ExtensionCore, options?: AppPickerOptions & { allowOtherAppTypes: true, throwOnCancel: true }): Promise<UserAppTreeItem | TeamAppTreeItem>
export function pickUserApp(core: ExtensionCore, options?: AppPickerOptions & { allowOtherAppTypes: true }): Promise<UserAppTreeItem | TeamAppTreeItem | undefined>
export function pickUserApp(core: ExtensionCore, options?: AppPickerOptions): Promise<UserAppTreeItem | undefined>
export async function pickUserApp(core: ExtensionCore, options: AppPickerOptions = {}): Promise<unknown> {
  const workspaceFolder = await core.getWorkspaceFolder({
    allowReadSelectedPath: false,
    fallbackUserChoice: false,
    token: options.token,
    uri: options.uri,
  });

  let ID;
  if (workspaceFolder) {
    const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

    ID = dConfig.get(DiscloudConfigScopes.ID);

    if (options.allowOtherAppTypes && ID && core.teamAppTree.children.has(ID))
      return pickTeamApp(core, options);
  }

  const apps: QuickPickItem[] = [];

  if (options.noCached) await core.userAppTree.fetch();

  for (const app of core.userAppTree.children.values()) {
    apps.push({
      description: app.appId,
      iconPath: app.iconPath as Uri,
      label: [
        app.data.name,
        app.online ? t("online") : t("offline"),
      ].join(" - "),
    });
  }

  const teamAppsSize = core.teamAppTree.size;

  if (!apps.length) {
    if (!options.noCached) {
      options.noCached = true;
      return pickUserApp(core, options);
    }

    if (!options.allowOtherAppTypes || !teamAppsSize)
      throw new Error(t("no.apps.found.to.choose"));

    return pickTeamApp(core, options);
  }

  let hasApp = false;

  if (ID) {
    hasApp = apps.some(app => app.description === ID);

    if (hasApp) {
      apps.sort(a => a.description === ID ? -1 : 1);

      apps[0].picked = true;
    }
  }

  const moreAppsLabel = t("n.more", { n: apps.length - 1 });

  const items = Array.from(apps);

  if (hasApp && apps.length > 1) {
    items.splice(1, items.length, { label: moreAppsLabel });
  }

  const seeOtherAppTypesLabel = t("see.also.your.n.team.apps", { n: teamAppsSize });

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
        return pickTeamApp(core, options);
    }
  } while (!picked);

  if (!picked) {
    if (options.throwOnCancel)
      throw Error(t("missing.appid"));

    return;
  }

  const pickedID = picked.description!;

  return core.userAppTree.children.get(pickedID);
}

export function pickTeamApp(core: ExtensionCore, options?: AppPickerOptions & { throwOnCancel: true }): Promise<TeamAppTreeItem>
export function pickTeamApp(core: ExtensionCore, options?: AppPickerOptions & { allowOtherAppTypes: true, throwOnCancel: true }): Promise<UserAppTreeItem | TeamAppTreeItem>
export function pickTeamApp(core: ExtensionCore, options?: AppPickerOptions & { allowOtherAppTypes: true }): Promise<UserAppTreeItem | TeamAppTreeItem | undefined>
export function pickTeamApp(core: ExtensionCore, options?: AppPickerOptions): Promise<TeamAppTreeItem | undefined>
export async function pickTeamApp(core: ExtensionCore, options: AppPickerOptions = {}): Promise<unknown> {
  const workspaceFolder = await core.getWorkspaceFolder({
    allowReadSelectedPath: false,
    fallbackUserChoice: false,
    token: options.token,
    uri: options.uri,
  });

  let ID;
  if (workspaceFolder) {
    const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

    ID = dConfig.get(DiscloudConfigScopes.ID);

    if (options.allowOtherAppTypes && ID && core.userAppTree.children.has(ID))
      return pickUserApp(core, options);
  }

  const apps: QuickPickItem[] = [];

  if (options.noCached) await core.teamAppTree.fetch(true);

  for (const app of core.teamAppTree.children.values()) {
    if (app.permissions.has(ModPermissionsFlags.commit_app)) {
      apps.push({
        description: app.appId,
        iconPath: app.iconPath as Uri,
        label: [
          app.data.name,
          app.online ? t("online") : t("offline"),
        ].join(" - "),
      });
    }
  }

  const userAppsSize = core.userAppTree.size;

  if (!apps.length) {
    if (!options.noCached) {
      options.noCached = true;
      return pickTeamApp(core, options);
    }

    if (!options.allowOtherAppTypes || !userAppsSize)
      throw new Error(t("no.apps.found.to.choose"));

    return pickUserApp(core, options);
  }

  let hasApp = false;

  if (ID) {
    hasApp = apps.some(app => app.description === ID);

    if (hasApp) {
      apps.sort(a => a.description === ID ? -1 : 1);

      apps[0].picked = true;
    }
  }

  const moreAppsLabel = t("n.more", { n: apps.length - 1 });

  const items = Array.from(apps);

  if (hasApp && apps.length > 1) items.splice(1, items.length, { label: moreAppsLabel });

  const seeOtherAppTypesLabel = t("see.also.your.n.apps", { n: userAppsSize });

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
        return pickUserApp(core, options);
    }
  } while (!picked);

  if (!picked) {
    if (options.throwOnCancel)
      throw Error(t("missing.appid"));

    return;
  }

  const pickedID = picked.description!;

  return core.teamAppTree.children.get(pickedID);
}
