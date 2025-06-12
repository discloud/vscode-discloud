import { t } from "@vscode/l10n";
import { Routes, type DiscloudConfig } from "discloud.app";
import { stripVTControlCharacters } from "util";
import { window } from "vscode";
import { type TaskData } from "../../../../@types";
import extension from "../../../../extension";
import SocketUploadClient from "./client";
import { type SocketEventUploadData } from "./types";

export async function socketUpload(task: TaskData, buffer: Buffer, dConfig: DiscloudConfig) {
  await new Promise<void>((resolve) => {
    const url = new URL(`${extension.api.baseURL}/ws${Routes.upload()}`);

    let connected = false;

    const logger = window.createOutputChannel("Discloud Upload");

    function showLog(value: string) {
      logger.appendLine(stripVTControlCharacters(value.replace(/[\r\n]+$/, "")));
      queueMicrotask(() => logger.show(true));
    }

    const ws = new SocketUploadClient(url, { headers: { "api-token": extension.api.token! } })
      .on("connecting", () => {
        task.progress.report({ increment: -1, message: t("socket.connecting") });
      })
      .on("connect", async () => {
        connected = true;

        task.progress.report({ increment: -1, message: t("uploading") });

        await ws.sendFile(buffer);
      })
      .on("upload", (data) => {
        if (data.progress) {
          task.progress.report({ increment: data.progress.bar });

          if (data.progress.log) showLog(data.progress.log);
        }

        if (data.message) showApiMessage(data);

        if (data.app) {
          dConfig.update({ ID: data.app.id, AVATAR: data.app.avatarURL });
          extension.appTree.addRawApp(data.app as any); // TODO: fix ApiUploadApp
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

        if (!message) return logger.appendLine(t("done"));

        try {
          const data: SocketEventUploadData = JSON.parse(message);

          if (data.progress) {
            task.progress.report({ increment: data.progress.bar });

            if (data.progress.log) showLog(data.progress.log);
          }

          if (data.message) showApiMessage(data);
        } catch { }
      });

    extension.context.subscriptions.push(logger, ws);

    ws.connect();
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
