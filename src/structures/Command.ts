import { t } from "@vscode/l10n";
import { DiscloudConfig, RESTGetApiAppAllResult, RESTGetApiAppTeamResult, RESTGetApiTeamResult, Routes } from "discloud.app";
import { QuickPickItem, window } from "vscode";
import { CommandData, TaskData } from "../@types";
import extension from "../extension";
import { requester } from "../util";

export default abstract class Command {
  constructor(public data: CommandData = {}) { }

  abstract run(taskData: TaskData, ...args: any[]): Promise<any>;

  async pickApp(task?: TaskData | null, ofTree: boolean = true) {
    task?.progress.report({ message: t("choose.app") });

    const apps = <QuickPickItem[]>[];
    if (ofTree && extension.appTree.children.size) {
      for (const app of extension.appTree.children.values()) {
        apps.push({
          description: app.appId,
          label: [
            app.data.name,
            app.data.online ? t("online") : t("offline"),
          ].join(" - "),
        });
      }
    } else {
      const res = await requester<RESTGetApiAppAllResult>(Routes.app("all"));
      if (!res.apps?.length) return;
      apps.push(...res.apps.map(app => ({
        description: app.id,
        label: [
          app.name,
          app.online ? t("online") : t("offline"),
        ].join(" - "),
      })));
    }

    const dConfig = new DiscloudConfig(extension.workspaceFolder!);

    let hasApp = false;

    if (dConfig.exists && dConfig.data.ID) {
      hasApp = apps.some(app => app.description === dConfig.data.ID!);

      if (hasApp) {
        apps.sort(a => a.description === dConfig.data.ID ? -1 : 1);

        apps[0].picked = true;
      }
    }

    const items = Array.from(apps);

    if (hasApp && apps.length > 1) {
      items.splice(1, items.length);
      items.push({
        label: t("n.more", { n: apps.length - 1 }),
      });
    }

    let picked = await window.showQuickPick(items, {
      canPickMany: false,
    });

    if (picked?.label === t("n.more", { n: apps.length - 1 })) {
      picked = await window.showQuickPick(apps, {
        canPickMany: false,
      });
    }

    if (!picked) return;

    const id = picked.description;

    task?.progress.report({ message: id });

    return id;
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

  async pickTeamApp(task?: TaskData | null, ofTree: boolean = true) {
    task?.progress.report({ message: t("choose.app") });

    const apps = <QuickPickItem[]>[];
    if (ofTree && extension.teamAppTree.children.size) {
      for (const app of extension.teamAppTree.children.values()) {
        apps.push({
          description: app.appId,
          label: [
            app.data.name,
            app.data.online ? t("online") : t("offline"),
          ].join(" - "),
        });
      }
    } else {
      const res = await requester<RESTGetApiTeamResult>(Routes.team());
      if (!res.apps?.length) return;
      apps.push(...res.apps.map(app => ({
        description: app.id,
        label: [
          app.name,
          app.online ? t("online") : t("offline"),
        ].join(" - "),
      })));
    }

    const dConfig = new DiscloudConfig(extension.workspaceFolder!);

    let hasApp = false;

    if (dConfig.exists && dConfig.data.ID) {
      hasApp = apps.some(app => app.description === dConfig.data.ID!);

      if (hasApp) {
        apps.sort(a => a.description === dConfig.data.ID ? -1 : 1);

        apps[0].picked = true;
      }
    }

    const items = Array.from(apps);

    if (hasApp && apps.length > 1) {
      items.splice(1, items.length);
      items.push({
        label: t("n.more", { n: apps.length - 1 }),
      });
    }

    let picked = await window.showQuickPick(items, {
      canPickMany: false,
    });

    if (picked?.label === t("n.more", { n: apps.length - 1 })) {
      picked = await window.showQuickPick(apps, {
        canPickMany: false,
      });
    }

    if (!picked) return;

    const id = picked.description;

    task?.progress.report({ message: id });

    return id;
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
