import { t } from "@vscode/l10n";
import { Routes } from "discloud.app";
import { stripVTControlCharacters } from "util";
import { window } from "vscode";
import { type TaskData } from "../../../../@types";
import extension from "../../../../extension";
import AppTreeItem from "../../../../structures/AppTreeItem";
import type TeamAppTreeItem from "../../../../structures/TeamAppTreeItem";
import SocketClient from "../client";
import { type SocketEventUploadData } from "../types";

export async function socketCommit(task: TaskData, buffer: Buffer, app: AppTreeItem | TeamAppTreeItem) {
  await new Promise<void>((resolve, reject) => {
    const isUserApp = app instanceof AppTreeItem;
    const appTree = isUserApp ? extension.appTree : extension.teamAppTree;

    const url = new URL(`${extension.api.baseURL}/ws${isUserApp ? Routes.appCommit(app.appId) : Routes.teamCommit(app.appId)}`);

    function showLog(value: string) {
      const lines = stripVTControlCharacters(value).replace(/^[\r\n]+|[\r\n]+$/g, "").split(/[\r\n]+/);
      for (const text of lines) app.output.info(text);
      queueMicrotask(() => app.output.show(true));
    }

    let connected = false;

    const ws = new SocketClient<SocketEventUploadData>(url)
      .on("connecting", () => {
        task.progress.report({ increment: -1, message: t("socket.connecting") });
      })
      .on("connect", async () => {
        connected = true;

        task.progress.report({ increment: -1, message: t("committing") });

        await ws.sendFile(buffer);
      })
      .on("data", (data) => {
        if (data.progress) {
          task.progress.report({ increment: data.progress.bar });

          if (data.progress.log) showLog(data.progress.log);
        }

        if (data.message) showApiMessage(data);

        if (data.logs) showLog(data.logs);

        if (data.statusCode !== 102) {
          const isDone = data.statusCode === 200;
          const isCodeError = !isDone;

          appTree.editRawApp(app.appId, {
            online: isDone,
            exitCode: isCodeError ? 1 : 0,
          });
        }
      })
      .on("error", (error) => {
        extension.logger.error(error);
      })
      .once("close", async (code, reason) => {
        resolve();

        if (!connected) {
          await window.showErrorMessage(t(code === 1008 ? "socket.authentication.fail" : "socket.connecting.fail"));
          return;
        }

        if (!reason.length) return app.output.append(t("done"));

        try {
          const data: SocketEventUploadData = JSON.parse(reason.toString());

          if (data.progress) {
            task.progress.report({ increment: data.progress.bar });

            if (data.progress.log) showLog(data.progress.log);
          }

          if (data.message) showApiMessage(data);
        } catch { }
      });

    extension.context.subscriptions.push(ws);

    ws.connect().catch(reject);
  });
}

function showApiMessage(data: Data) {
  if ("status" in data) {
    const status = t(`${data.status}`);

    if (data.status === "ok") {
      window.showInformationMessage(
        `${status}`
        + (typeof data.statusCode === "number" ? ` ${data.statusCode}` : "")
        + (data.message ? `: ${data.message}` : ""),
      );
    } else {
      window.showWarningMessage(
        `${status}`
        + (typeof data.statusCode === "number" ? ` ${data.statusCode}` : "")
        + (data.message ? `: ${data.message}` : ""),
      );
    }
  }
}

interface Data {
  status?: string
  statusCode?: number
  message?: string | null
}
