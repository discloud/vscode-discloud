import { t } from "@vscode/l10n";
import { Routes, type DiscloudConfig } from "discloud.app";
import { stripVTControlCharacters } from "util";
import { window } from "vscode";
import { type TaskData } from "../../../../@types";
import extension from "../../../../extension";
import { MAX_UPLOAD_SIZE } from "../../constants";
import SocketClient from "../client";
import { type SocketEventUploadData } from "../types";

export async function socketUpload(task: TaskData, buffer: Buffer, dConfig: DiscloudConfig) {
  await new Promise<void>((resolve, reject) => {
    if (buffer.length > MAX_UPLOAD_SIZE) return reject(t("file.too.big", { value: "512MB" }));

    const url = new URL(`${extension.api.baseURL}/ws${Routes.upload()}`);

    const logger = window.createOutputChannel("Discloud Upload");

    function showLog(value: string) {
      logger.appendLine(stripVTControlCharacters(value.replace(/[\r\n]+$/, "")));
      queueMicrotask(() => logger.show(true));
    }

    let connected = false;

    const ws = new SocketClient<SocketEventUploadData>(url)
      .on("connecting", () => {
        task.progress.report({ increment: -1, message: t("socket.connecting") });
      })
      .on("connect", async () => {
        connected = true;

        task.progress.report({ increment: -1, message: t("uploading") });

        await ws.sendFile(buffer);
      })
      .on("data", (data) => {
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

        if (!connected) {
          await window.showErrorMessage(t(code === 1008 ? "socket.authentication.fail" : "socket.connecting.fail"));
          return;
        }

        if (!reason.length) return logger.appendLine(t("done"));

        try {
          const data: SocketEventUploadData = JSON.parse(reason.toString());

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
