import { t } from "@vscode/l10n";
import { RESTGetApiAppAllResult, RESTGetApiTeamResult, Routes } from "discloud.app";
import { window } from "vscode";
import { CommandData, TaskData } from "../@types";
import { requester } from "../util";

export default abstract class Command {
  constructor(public data: CommandData = {}) { }

  abstract run(taskData: TaskData, ...args: any[]): Promise<any>;

  async pickApp() {
    const res = await requester<RESTGetApiAppAllResult>(Routes.app("all"));
    if (!res.apps?.length) return;

    const apps = res.apps.map(app => `${app.id} - ${app.name} - ${app.online ? t("online") : t("offline")}`);

    const picked = await window.showQuickPick(apps, {
      canPickMany: false,
    });
    if (!picked) return;

    return picked.split(" - ")[0];
  }

  async pickTeamApp() {
    const res = await requester<RESTGetApiTeamResult>(Routes.team());
    if (!res.apps?.length) return;

    const apps = res.apps.map(app => `${app.id} - ${app.name} - ${app.online ? "Online" : "Offline"}`);

    const picked = await window.showQuickPick(apps, {
      canPickMany: false,
    });
    if (!picked) return;

    return picked.split(" - ")[0];
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
}

type ActionTypes = "showErrorMessage" | "showInformationMessage" | "showQuickPick" | "showWarningMessage";

interface ActionOptions {
  action?: string
  title: string;
  type?: ActionTypes;
}