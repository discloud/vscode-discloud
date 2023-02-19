import { t } from "@vscode/l10n";
import { RESTGetApiAppAllResult, RESTGetApiAppResult, RESTGetApiTeamResult, Routes } from "discloud.app";
import { window } from "vscode";
import { CommandData, TaskData } from "../@types";
import extension from "../extension";
import { requester } from "../util";

export default abstract class Command {
  constructor(public data: CommandData = {}) { }

  abstract run(taskData: TaskData, ...args: any[]): Promise<any>;

  async pickApp(task?: TaskData | null, ofTree: boolean = true) {
    task?.progress.report({ message: t("choose.app") });

    const apps = [];
    if (ofTree && extension.appTree.children.size) {
      for (const app of extension.appTree.children.values()) {
        apps.push(
          `${app.appId}`
          + ("name" in app.data ? ` - ${app.data.name}` : "")
          + ("online" in app.data ? ` - ${app.data.online ? t("online") : t("offline")}` : "")
        );
      }
    } else {
      const res = await requester<RESTGetApiAppAllResult>(Routes.app("all"));
      if (!res.apps?.length) return;
      apps.push(...res.apps.map(app => `${app.id} - ${app.name} - ${app.online ? t("online") : t("offline")}`));
    }

    const picked = await window.showQuickPick(apps, {
      canPickMany: false,
    });
    if (!picked) return;

    const id = picked.split(" - ")[0];

    task?.progress.report({ message: id });

    return id;
  }

  async pickAppMod(appId: string, task?: TaskData | null) {
    task?.progress.report({ message: t("choose.mod") });

    const res = await requester<RESTGetApiAppResult>(Routes.app(appId));
    if (!res.apps?.mods?.length) return;

    const picked = await window.showQuickPick(res.apps.mods, {
      canPickMany: false,
    });
    if (!picked) return;

    task?.progress.report({ message: picked });

    return picked;
  }

  async pickTeamApp(task?: TaskData | null, ofTree: boolean = true) {
    task?.progress.report({ message: t("choose.app") });

    const apps = [];
    if (ofTree && extension.teamAppTree.children.size) {
      for (const app of extension.teamAppTree.children.values()) {
        apps.push(
          `${app.appId}`
          + ("online" in app.data ? ` - ${app.data.online ? t("online") : t("offline")}` : "")
        );
      }
    } else {
      const res = await requester<RESTGetApiTeamResult>(Routes.team());
      if (!res.apps?.length) return;
      apps.push(...res.apps.map(app => `${app.id} - ${app.name} - ${app.online ? t("online") : t("offline")}`));
    }

    const picked = await window.showQuickPick(apps, {
      canPickMany: false,
    });
    if (!picked) return;

    const id = picked.split(" - ")[0];

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
      quickPick = await window[data.type!](t(data.title, { action: data.action }), actionOk, actionCancel);
    }

    return quickPick === actionOk;
  }

  logger(name: string, log: string, show = true) {
    const output = window.createOutputChannel(name, { log: true });

    output.info(log);

    if (show) setTimeout(() => output.show(), 100);
  }

  showApiMessage(data: Data) {
    if ("status" in data) {
      const status = t(`${data.status}`);

      if (data.status === "ok") {
        window.showInformationMessage(`${status}: ${data.message}`);
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