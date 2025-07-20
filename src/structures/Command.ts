import { type RESTGetApiAppTeamResult, Routes } from "@discloudapp/api-types/v2";
import { t } from "@vscode/l10n";
import { stripVTControlCharacters } from "util";
import { type LogOutputChannel, type QuickPickItem, window } from "vscode";
import { type CommandData, type TaskData } from "../@types";
import core from "../extension";

export interface CommandConstructor {
  new(...args: any[]): Command
}

export default abstract class Command {
  constructor(readonly data: CommandData = {}) { }

  abstract run(taskData: TaskData | null, ...args: any[]): Promise<unknown>;

  async pickAppMod(appId: string, task?: TaskData | null) {
    task?.progress.report({ increment: -1, message: t("choose.mod") });

    const response = await core.api.queueGet<RESTGetApiAppTeamResult>(Routes.appTeam(appId), {});
    if (!response?.team?.length) return;

    const mods = new Map(response.team.map(team => [team.modID, {
      id: team.modID,
      perms: new Set(team.perms),
    }]));

    const options = response.team.map<QuickPickItem>(team => ({
      label: team.modID,
      description: team.perms.join(", "),
    }));

    const picked = await window.showQuickPick(options, { canPickMany: false });
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
      output = core.getLogOutputChannel(output);

    output.info("\n" + stripVTControlCharacters(log));

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
  message?: string | null
}
