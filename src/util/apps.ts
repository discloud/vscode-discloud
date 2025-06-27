import { t } from "@vscode/l10n";
import { DiscloudConfig, DiscloudConfigScopes, ModPermissionsFlags } from "discloud.app";
import { window, type CancellationToken, type QuickPickItem, type Uri } from "vscode";
import type { VscodeProgressReporter } from "../@types";
import extension from "../extension";
import type AppTreeItem from "../structures/AppTreeItem";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";

interface AppPickerOptions {
  allowOtherAppTypes?: boolean
  noCached?: boolean
  progress?: VscodeProgressReporter
  throwOnCancel?: boolean
  token?: CancellationToken
  uri?: Uri
}

export function pickApp(options?: AppPickerOptions & { allowOtherAppTypes: false }): Promise<never>
export function pickApp(options?: AppPickerOptions & { throwOnCancel: true }): Promise<AppTreeItem | TeamAppTreeItem>
export function pickApp(options?: AppPickerOptions): Promise<AppTreeItem | TeamAppTreeItem | undefined>
export async function pickApp(options: AppPickerOptions = {}) {
  options.progress?.report({ increment: -1, message: t("choose.app") });

  options.allowOtherAppTypes = true;

  const workspaceFolder = await extension.getWorkspaceFolder({
    allowReadSelectedPath: false,
    fallbackUserChoice: false,
    token: options.token,
    uri: options.uri,
  });

  if (workspaceFolder) {
    const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

    const ID = dConfig.get(DiscloudConfigScopes.ID);

    if (ID) {
      if (extension.appTree.children.has(ID)) return pickUserApp(options);
      if (extension.teamAppTree.children.has(ID)) return pickTeamApp(options);
    }
  }

  return pickUserApp(options);
}

export function pickUserApp(options?: AppPickerOptions & { throwOnCancel: true }): Promise<AppTreeItem>
export function pickUserApp(options?: AppPickerOptions & { allowOtherAppTypes: true, throwOnCancel: true }): Promise<AppTreeItem | TeamAppTreeItem>
export function pickUserApp(options?: AppPickerOptions & { allowOtherAppTypes: true }): Promise<AppTreeItem | TeamAppTreeItem | undefined>
export function pickUserApp(options?: AppPickerOptions): Promise<AppTreeItem | undefined>
export async function pickUserApp(options: AppPickerOptions = {}): Promise<unknown> {
  const workspaceFolder = await extension.getWorkspaceFolder({
    allowReadSelectedPath: false,
    fallbackUserChoice: false,
    token: options.token,
    uri: options.uri,
  });

  let ID;
  if (workspaceFolder) {
    const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

    ID = dConfig.get(DiscloudConfigScopes.ID);

    if (options.allowOtherAppTypes && ID && extension.teamAppTree.children.has(ID))
      return pickTeamApp(options);
  }

  const apps: QuickPickItem[] = [];

  if (options.noCached) await extension.appTree.fetch();

  for (const app of extension.appTree.children.values()) {
    apps.push({
      description: app.appId,
      iconPath: app.iconPath as Uri,
      label: [
        app.data.name,
        app.online ? t("online") : t("offline"),
      ].join(" - "),
    });
  }

  const teamAppsSize = extension.teamAppTree.size;

  if (!apps.length) {
    if (!options.noCached) {
      options.noCached = true;
      return pickUserApp(options);
    }

    if (!options.allowOtherAppTypes || !teamAppsSize)
      throw new Error(t("no.apps.found.to.choose"));

    return pickTeamApp(options);
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
        return pickTeamApp(options);
    }
  } while (!picked);

  if (!picked) {
    if (options.throwOnCancel)
      throw Error(t("missing.appid"));

    return;
  }

  const pickedID = picked.description!;

  return extension.appTree.children.get(pickedID);
}

export function pickTeamApp(options?: AppPickerOptions & { throwOnCancel: true }): Promise<TeamAppTreeItem>
export function pickTeamApp(options?: AppPickerOptions & { allowOtherAppTypes: true, throwOnCancel: true }): Promise<AppTreeItem | TeamAppTreeItem>
export function pickTeamApp(options?: AppPickerOptions & { allowOtherAppTypes: true }): Promise<AppTreeItem | TeamAppTreeItem | undefined>
export function pickTeamApp(options?: AppPickerOptions): Promise<TeamAppTreeItem | undefined>
export async function pickTeamApp(options: AppPickerOptions = {}): Promise<unknown> {
  const workspaceFolder = await extension.getWorkspaceFolder({
    allowReadSelectedPath: false,
    fallbackUserChoice: false,
    token: options.token,
    uri: options.uri,
  });

  let ID;
  if (workspaceFolder) {
    const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

    ID = dConfig.get(DiscloudConfigScopes.ID);

    if (options.allowOtherAppTypes && ID && extension.appTree.children.has(ID))
      return pickUserApp(options);
  }

  const apps: QuickPickItem[] = [];

  if (options.noCached) await extension.teamAppTree.fetch(true);

  for (const app of extension.teamAppTree.children.values()) {
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

  const userAppsSize = extension.appTree.size;

  if (!apps.length) {
    if (!options.noCached) {
      options.noCached = true;
      return pickTeamApp(options);
    }

    if (!options.allowOtherAppTypes || !userAppsSize)
      throw new Error(t("no.apps.found.to.choose"));

    return pickUserApp(options);
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
        return pickUserApp(options);
    }
  } while (!picked);

  if (!picked) {
    if (options.throwOnCancel)
      throw Error(t("missing.appid"));

    return;
  }

  const pickedID = picked.description!;

  return extension.teamAppTree.children.get(pickedID);
}
