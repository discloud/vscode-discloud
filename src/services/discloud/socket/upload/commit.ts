import { t } from "@vscode/l10n";
import { Routes } from "discloud.app";
import { stripVTControlCharacters } from "util";
import { window } from "vscode";
import { type TaskData } from "../../../../@types";
import extension from "../../../../extension";
import AppTreeItem from "../../../../structures/AppTreeItem";
import type TeamAppTreeItem from "../../../../structures/TeamAppTreeItem";
import SocketUploadClient from "./client";
import { type SocketEventUploadData } from "./types";

export async function socketCommit(task: TaskData, buffer: Buffer, app: AppTreeItem | TeamAppTreeItem) {
  await new Promise<void>((resolve, reject) => {
    const isUserApp = app instanceof AppTreeItem;

    const url = new URL(`${extension.api.baseURL}/ws${isUserApp ? Routes.appCommit(app.appId) : Routes.teamCommit(app.appId)}`);

    let connected = false;

    function showLog(value: string) {
      app.output.append(stripVTControlCharacters(value));
      queueMicrotask(() => app.output.show(true));
    }

    const ws = new SocketUploadClient(url, { headers: { "api-token": extension.api.token! } })
      .on("connecting", () => {
        task.progress.report({ increment: -1, message: t("socket.connecting") });
      })
      .on("connect", async () => {
        connected = true;

        task.progress.report({ increment: -1, message: t("committing") });

        app.output.appendLine("");

        await ws.sendFile(buffer);
      })
      .on("upload", (data) => {
        if (data.progress) {
          task.progress.report({ increment: data.progress.bar });

          if (data.progress.log) showLog(data.progress.log);
        }

        if (data.message) showApiMessage(data);

        if (data.app) {
          extension.appTree.fetch();
        }

        if (data.logs) showLog(data.logs);
      })
      .on("error", (error) => {
        extension.logger.error(error);
      })
      .once("close", async (code, reason) => {
        resolve();

        ws.dispose();

        if (!connected) {
          if (code === 1008) return;
          await window.showErrorMessage(t("socket.connecting.fail"));
          return;
        }

        const message = reason.toString();

        if (!message) return app.output.append(t("done"));

        try {
          const data: SocketEventUploadData = JSON.parse(message);

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
