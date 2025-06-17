import { t } from "@vscode/l10n";
import { DiscloudConfig, DiscloudConfigScopes, ModPermissionsBF, ModPermissionsFlags, type ModPermissionsResolvable, type RESTGetApiAppTeamResult, type RESTGetApiTeamResult, Routes } from "discloud.app";
import { type LogOutputChannel, type QuickPickItem, type Uri, window } from "vscode";
import { type CommandData, type TaskData } from "../@types";
import extension from "../extension";
import type AppTreeItem from "./AppTreeItem";
import type TeamAppTreeItem from "./TeamAppTreeItem";
import type VSUser from "./VSUser";

export interface CommandConstructor {
  new(...args: any[]): Command
}

export default abstract class Command {
  constructor(readonly data: CommandData = {}) { }

  abstract run(taskData: TaskData | null, ...args: any[]): Promise<unknown>;

  pickAppOrTeamApp(
    task: TaskData | null, options: AppPickerOptions & { showOther: false, startInTeamApps: true, throwOnCancel: false }
  ): Promise<Partial<AppPickerResult<TeamAppTreeItem>>>;
  pickAppOrTeamApp(
    task: TaskData | null, options: AppPickerOptions & { showOther: false, throwOnCancel: false }
  ): Promise<Partial<AppPickerResult<AppTreeItem>>>;
  pickAppOrTeamApp(
    task: TaskData | null, options: AppPickerOptions & { throwOnCancel: false }
  ): Promise<Partial<AppPickerResult>>;
  pickAppOrTeamApp(
    task: TaskData | null, options: AppPickerOptions & { showOther: false, startInTeamApps: true }
  ): Promise<AppPickerResult<TeamAppTreeItem>>;
  pickAppOrTeamApp(
    task: TaskData | null, options: AppPickerOptions & { showOther: false }
  ): Promise<AppPickerResult<AppTreeItem>>;
  pickAppOrTeamApp(task?: TaskData | null, options?: AppPickerOptions): Promise<AppPickerResult>;
  async pickAppOrTeamApp(task?: TaskData | null, options: AppPickerOptions = {}): Promise<Partial<AppPickerResult>> {
    options = Object.assign(<AppPickerOptions>{
      ofTree: true,
      showOther: true,
      startInTeamApps: false,
      throwOnCancel: true,
    }, options);

    task?.progress.report({ increment: -1, message: t("choose.app") });

    const apps = <QuickPickItem[]>[];
    const teamApps = <QuickPickItem[]>[];
    if (options.ofTree) {
      if (options.startInTeamApps ? options.showOther : true) {
        if (!extension.appTree.children.has("x")) {
          for (const app of extension.appTree.children.values()) {
            apps.push({
              description: app.appId,
              iconPath: <Uri>app.iconPath,
              label: [
                app.data.name,
                app.online ? t("online") : t("offline"),
              ].join(" - "),
            });
          }
        }
      }

      if (options.startInTeamApps ? true : options.showOther) {
        if (!extension.teamAppTree.children.has("x")) {
          for (const app of extension.teamAppTree.children.values()) {
            if (app.permissions.has(ModPermissionsFlags.commit_app)) {
              teamApps.push({
                description: app.appId,
                iconPath: <Uri>app.iconPath,
                label: [
                  app.data.name,
                  app.online ? t("online") : t("offline"),
                ].join(" - "),
              });
            }
          }
        }
      }
    }

    if (!apps.length || !teamApps.length) {
      const promises = [];

      if (!apps.length && (options.startInTeamApps ? options.showOther : true)) {
        promises[0] = await extension.user.fetch(true).catch(() => null);
      }

      if (!teamApps.length && (options.startInTeamApps ? true : options.showOther)) {
        promises[1] = extension.api.queueGet<RESTGetApiTeamResult>(Routes.team(), {}).catch(() => null);
      }

      const [resApps, resTeamApps] = await Promise.all(promises) as [VSUser, RESTGetApiTeamResult];

      if (resApps?.apps) {
        apps.splice(0, apps.length);

        for (const app of resApps.appsStatus) {
          extension.appTree.addRawApp(app, true);

          apps.push(<QuickPickItem>{
            description: app.id,
            iconPath: <Uri>extension.appTree.children.get(app.id)?.iconPath,
            label: [
              app.name,
              app.online ? t("online") : t("offline"),
            ].join(" - "),
          });
        }
      }

      if (resTeamApps?.apps) {
        teamApps.splice(0, teamApps.length);

        for (const app of resTeamApps.apps) {
          const perms = new ModPermissionsBF(<ModPermissionsResolvable>app.perms ?? []);

          if (perms.has(ModPermissionsFlags.commit_app)) {
            teamApps.push(<QuickPickItem>{
              description: app.id,
              label: [
                app.name,
                app.online ? t("online") : t("offline"),
              ].join(" - "),
            });
          }
        }
      }
    }

    const appsLength = apps.length;
    const teamAppsLength = teamApps.length;

    if (!appsLength && !teamAppsLength) throw new Error(t("no.apps.found.to.choose"));

    const workspaceFolder = await extension.getWorkspaceFolder().then(f => f?.fsPath);

    const dConfig = new DiscloudConfig(workspaceFolder!);

    const ID = dConfig.get(DiscloudConfigScopes.ID);

    let hasApp = false;
    let hasTeamApp = false;

    if (ID) {
      hasApp = apps.some(app => app.description === ID);
      hasTeamApp = teamApps.some(app => app.description === ID);

      if (hasApp) {
        apps.sort(a => a.description === ID ? -1 : 1);

        apps[0].picked = true;
      }

      if (hasTeamApp) {
        teamApps.sort(a => a.description === ID ? -1 : 1);

        teamApps[0].picked = true;
      }
    }

    const items = Array.from(apps);
    const teamItems = Array.from(teamApps);

    const labelMore = t("n.more", { n: apps.length - 1 });
    const teamLabelMore = t("n.more", { n: teamApps.length - 1 });
    const appsLabel = t("see.also.your.n.apps", { n: apps.length });
    const teamAppsLabel = t("see.also.your.n.team.apps", { n: teamApps.length });

    if (hasApp && apps.length > 1) {
      items.splice(1, items.length);
      items.push({ label: labelMore });
    }

    if (hasTeamApp && teamApps.length > 1) {
      teamItems.splice(1, teamItems.length);
      teamItems.push({ label: teamLabelMore });
    }

    if (appsLength) {
      teamApps.push({ label: appsLabel });
      teamItems.push({ label: appsLabel });
    }

    if (teamAppsLength) {
      apps.push({ label: teamAppsLabel });
      items.push({ label: teamAppsLabel });
    }

    let isTeamApp = Boolean(hasTeamApp || options.startInTeamApps);
    let picked: QuickPickItem | undefined;
    do {
      isTeamApp = picked?.label ? picked.label === teamAppsLabel : isTeamApp;

      picked = await window.showQuickPick(isTeamApp ? teamItems : items, {
        canPickMany: false,
      });

      if (!picked) break;

      if ([labelMore, teamLabelMore].includes(picked.label)) {
        picked = await window.showQuickPick([appsLabel, labelMore].includes(picked.label) ? apps : teamApps, {
          canPickMany: false,
        });
      }
    } while (picked?.label ? [appsLabel, teamAppsLabel].includes(picked.label) : false);

    if (!picked) {
      if (options.throwOnCancel)
        throw Error(t("missing.appid"));

      return {};
    }

    const id = picked.description!;

    task?.progress.report({ message: id });

    return {
      app: isTeamApp ? extension.teamAppTree.children.get(id) : extension.appTree.children.get(id),
      id,
      isApp: !isTeamApp,
      isTeamApp,
    };
  }

  async pickAppMod(appId: string, task?: TaskData | null) {
    task?.progress.report({ increment: -1, message: t("choose.mod") });

    const response = await extension.api.queueGet<RESTGetApiAppTeamResult>(Routes.appTeam(appId), {});
    if (!response?.team?.length) return;

    const mods = new Map(response.team.map(team => [team.modID, {
      id: team.modID,
      perms: new Set(team.perms),
    }]));

    const options = response.team.map(team => <QuickPickItem>{
      label: team.modID,
      description: team.perms.join(", "),
    });

    const picked = await window.showQuickPick(options, {
      canPickMany: false,
    });
    if (!picked) return;

    task?.progress.report({ message: picked.label });

    return mods.get(picked.label);
  }

  confirmAction(): Promise<boolean>
  confirmAction(data: string): Promise<boolean>
  confirmAction(data: ActionOptions & { throwOnReject: boolean | ErrorMessage }): Promise<void>
  confirmAction(data: ActionOptions): Promise<boolean>
  async confirmAction(data?: string | ActionOptions): Promise<unknown> {
    data = {
      title: typeof data === "string" ? data : data?.title ?? "common.confirm",
      type: typeof data === "string" ? "showInformationMessage" : data?.type ?? "showInformationMessage",
    };

    const actionOk = t("action.ok");
    const actionCancel = t("action.cancel");

    let quickPick;
    switch (data.type) {
      case "showQuickPick":
        quickPick = await window.showQuickPick([actionOk, actionCancel], { title: t(data.title!, { action: data.action! }) });
        break;

      default:
        quickPick = await window[data.type!](t(data.title!, { action: data.action! }), actionOk, actionCancel);
        break;
    }

    const resultIsOk = quickPick === actionOk;

    if (data.throwOnReject) {
      if (resultIsOk) return;
      throw Error(t(typeof data.throwOnReject === "string" ? data.throwOnReject : "rejected.action"));
    }

    return resultIsOk;
  }

  /**
   * @param show
   * @default true
   */
  logger(output: LogOutputChannel | string, log: string, show?: true): void;
  logger(output: LogOutputChannel | string, log: string, show: false): void;
  logger(output: LogOutputChannel, log: string, show?: true): void;
  logger(output: LogOutputChannel, log: string, show: false): void;
  logger(output: LogOutputChannel, log: string, show = true) {
    if (typeof output === "string")
      output = extension.getLogOutputChannel(output);

    output.info("\n" + log);

    if (show) queueMicrotask(() => output.show(false));
  }

  showApiMessage(data: Data) {
    if ("status" in data) {
      window.showWarningMessage(
        t(`${data.status}`)
        + (typeof data.statusCode === "number" ? ` ${data.statusCode}` : "")
        + (data.message ? `: ${data.message}` : ""),
      );
    }
  }
}

type ActionTypes = "showErrorMessage" | "showInformationMessage" | "showQuickPick" | "showWarningMessage";

type ErrorMessage = string;

interface ActionOptions {
  action?: string
  title?: string
  type?: ActionTypes
  throwOnReject?: boolean | ErrorMessage
}

interface Data {
  status?: string
  statusCode?: number
  message?: string
}

interface AppPickerOptions {
  /** @default true */
  ofTree?: boolean
  /** @default true */
  showOther?: boolean
  /** @default false */
  startInTeamApps?: boolean
  /** @default true */
  throwOnCancel?: boolean
}

interface AppPickerResult<AppType extends AppTreeItem | TeamAppTreeItem = AppTreeItem | TeamAppTreeItem> {
  app: AppType;
  id: string;
  isApp: boolean;
  isTeamApp: boolean;
}
