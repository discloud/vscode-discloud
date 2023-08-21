import { t } from "@vscode/l10n";
import { DiscloudConfig, ModPermissions, ModPermissionsBF, ModPermissionsResolvable, RESTGetApiAppAllResult, RESTGetApiAppTeamResult, RESTGetApiTeamResult, Routes } from "discloud.app";
import { QuickPickItem, Uri, window } from "vscode";
import { CommandData, TaskData } from "../@types";
import extension from "../extension";
import { requester } from "../util";
import AppTreeItem from "./AppTreeItem";

export default abstract class Command {
  constructor(public data: CommandData = {}) { }

  abstract run(taskData: TaskData, ...args: any[]): Promise<any>;

  async pickAppOrTeamApp(task?: TaskData | null, options: AppPickerOptions = {}) {
    options = Object.assign({
      ofTree: true,
      showOther: true,
      startInTeamApps: false,
    }, options);

    task?.progress.report({ message: t("choose.app") });

    const apps = <QuickPickItem[]>[];
    const teamApps = <QuickPickItem[]>[];
    if (options.ofTree) {
      if (options.startInTeamApps ? options.showOther : true) {
        for (const app of extension.appTree.children.values()) {
          apps.push({
            description: app.appId,
            iconPath: <Uri>app.iconPath,
            label: [
              app.data.name,
              app.isOnline ? t("online") : t("offline"),
            ].join(" - "),
          });
        }
      }

      if (options.startInTeamApps ? true : options.showOther) {
        for (const app of extension.teamAppTree.children.values()) {
          if (app.permissions.has(ModPermissions.commit_app)) {
            teamApps.push({
              description: app.appId,
              iconPath: <Uri>app.iconPath,
              label: [
                app.data.name,
                app.isOnline ? t("online") : t("offline"),
              ].join(" - "),
            });
          }
        }
      }
    }

    if (!apps.length || !teamApps.length) {
      const promises = [];

      if (!apps.length && (options.startInTeamApps ? options.showOther : true)) {
        promises[0] = requester<RESTGetApiAppAllResult>(Routes.app("all"));
      }

      if (!teamApps.length && (options.startInTeamApps ? true : options.showOther)) {
        promises[1] = requester<RESTGetApiTeamResult>(Routes.team());
      }

      const [resApps, resTeamApps] = await Promise.all(promises) as [RESTGetApiAppAllResult, RESTGetApiTeamResult];

      if (resApps?.apps) {
        apps.splice(0, apps.length);

        for (const app of resApps.apps) {
          apps.push(<QuickPickItem>{
            description: app.id,
            iconPath: <Uri>new AppTreeItem(app).iconPath,
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

          if (perms.has(ModPermissions.commit_app)) {
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

    const dConfig = new DiscloudConfig(extension.workspaceFolder!);

    let hasApp = false;
    let hasTeamApp = false;

    if (dConfig.exists && dConfig.data.ID) {
      hasApp = apps.some(app => app.description === dConfig.data.ID!);
      hasTeamApp = teamApps.some(app => app.description === dConfig.data.ID);

      if (hasApp) {
        apps.sort(a => a.description === dConfig.data.ID ? -1 : 1);

        apps[0].picked = true;
      }

      if (hasTeamApp) {
        teamApps.sort(a => a.description === dConfig.data.ID ? -1 : 1);

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

    if (apps.length) {
      teamItems.push({ label: appsLabel });
    }

    if (teamApps.length) {
      items.push({ label: teamAppsLabel });
    }

    let isTeamApp = Boolean(hasTeamApp || options.startInTeamApps);
    let picked: QuickPickItem | undefined;
    do {
      isTeamApp = picked?.label ? picked.label === teamAppsLabel : isTeamApp;

      picked = await window.showQuickPick(picked?.label ?
        picked.label === teamAppsLabel ?
          teamItems :
          items :
        hasTeamApp ?
          teamItems :
          options.startInTeamApps ?
            teamItems :
            items, {
        canPickMany: false,
      });

      if (!picked) break;

      if ([labelMore, teamLabelMore].includes(picked.label)) {
        picked = await window.showQuickPick(picked.label === appsLabel ? apps : teamApps, {
          canPickMany: false,
        });
      }
    } while (picked?.label ? [appsLabel, teamAppsLabel].includes(picked.label) : false);

    if (!picked) return {};

    const id = picked.description;

    task?.progress.report({ message: id });

    return {
      id,
      isApp: !isTeamApp,
      isTeamApp,
    };
  }

  async pickAppMod(appId: string, task?: TaskData | null) {
    task?.progress.report({ message: t("choose.mod") });

    const res = await requester<RESTGetApiAppTeamResult>(Routes.appTeam(appId));
    if (!res.team?.length) return;

    const mods = new Map(res.team.map(team => [team.modID, {
      id: team.modID,
      perms: new Set(team.perms),
    }]));

    const options = res.team.map(team => <QuickPickItem>{
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

  async confirmAction(data?: string | ActionOptions) {
    data = {
      title: typeof data === "string" ? data : data?.title ?? "common.confirm",
      type: typeof data === "string" ? "showInformationMessage" : data?.type ?? "showInformationMessage",
    };

    const actionOk = t("action.ok");
    const actionCancel = t("action.cancel");

    let quickPick;
    if (data.type === "showQuickPick") {
      quickPick = await window.showQuickPick([actionOk, actionCancel], {
        title: t(data.title),
      });
    } else {
      quickPick = await window[data.type!](t(data.title, { action: data.action! }), actionOk, actionCancel);
    }

    return quickPick === actionOk;
  }

  logger(name: string, log: string, show = true) {
    const output = window.createOutputChannel(name, { log: true });

    output.info(log);

    if (show) {
      output.show(false);

      setTimeout(() => output.show(false), 250);
    };
  }

  showApiMessage(data: Data) {
    if ("status" in data) {
      const status = t(`${data.status}`);

      if (data.status === "ok") {
        window.showInformationMessage(
          `${status}`
          + (typeof data.statusCode === "number" ? ` ${data.statusCode}` : "")
          + (data.message ? `: ${data.message}` : "")
        );
      } else {
        window.showWarningMessage(
          `${status}`
          + (typeof data.statusCode === "number" ? ` ${data.statusCode}` : "")
          + (data.message ? `: ${data.message}` : "")
        );
      }
    }
  }
}

type ActionTypes = "showErrorMessage" | "showInformationMessage" | "showQuickPick" | "showWarningMessage";

interface ActionOptions {
  action?: string
  title: string;
  type?: ActionTypes;
}

interface Data {
  status?: string
  statusCode?: number
  message?: string
}

interface AppPickerOptions {
  ofTree?: boolean
  showOther?: boolean
  startInTeamApps?: boolean
}
