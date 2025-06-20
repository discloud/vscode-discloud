import { t } from "@vscode/l10n";
import { Routes, type DiscloudConfig } from "discloud.app";
import { stripVTControlCharacters } from "util";
import { window } from "vscode";
import { type ApiVscodeApp, type TaskData } from "../../../../@types";
import extension from "../../../../extension";
import { MAX_FILE_SIZE } from "../../constants";
import SocketClient from "../client";
import { type SocketEventUploadData } from "../types";

export async function socketUpload(task: TaskData, buffer: Buffer, dConfig: DiscloudConfig) {
  await new Promise<void>((resolve, reject) => {
    if (buffer.length > MAX_FILE_SIZE) return reject(t("file.too.big", { value: "512MB" }));

    const url = new URL(`${extension.api.baseURL}/ws${Routes.upload()}`);

    const logger = window.createOutputChannel("Discloud Upload", { log: true });

    function showLog(value: string) {
      const lines = stripVTControlCharacters(value).replace(/^[\r\n]+|[\r\n]+$/g, "").split(/[\r\n]+/);
      for (const text of lines) logger.info(text);
      queueMicrotask(() => logger.show(true));
    }

    let connected = false;
    let uploading = false;

    const ws = new SocketClient<SocketEventUploadData>(url)
      .on("connecting", () => {
        task.progress.report({ increment: -1, message: t("socket.connecting") });
      })
      .on("connect", async () => {
        connected = true;
        uploading = true;

        showLog("-".repeat(60));

        task.progress.report({ increment: -1, message: t("uploading") });

        await ws.sendFile(buffer, (data) => {
          task.progress.report({ increment: 100 / data.total });
        });

        task.progress.report({ increment: -1 });

        uploading = false;
      })
      .on("data", async (data) => {
        if (data.progress) {
          if (!uploading) task.progress.report({ increment: data.progress.bar });

          if (data.progress.log) showLog(data.progress.log);
        }

        if (data.message) showApiMessage(data);

        if (data.app) {
          dConfig.update({ ID: data.app.id, AVATAR: data.app.avatarURL });

          const app: ApiVscodeApp = {
            apts: dConfig.data.APT as any,
            clusterName: "",
            exitCode: data.statusCode === 200 ? 0 : 1,
            online: data.statusCode === 200,
            ramKilled: false,
            syncGit: null,
            ...data.app,
          };

          extension.appTree.addRawApp(app); // TODO: fix ApiUploadApp
        }

        if (data.logs) showLog(data.logs);
      })
      .on("error", (error) => {
        extension.logger.error(error);
      })
      .once("close", async (code, reason) => {
        resolve();

        setTimeout(() => logger.dispose(), 60_000);

        if (!connected) {
          await window.showErrorMessage(t(code === 1008 ? "socket.authentication.fail" : "socket.connecting.fail"));
          return;
        }

        if (code !== 1000) {
          await window.showErrorMessage(t(`socket.close.${code}`));
          return;
        }

        if (!reason.length) return logger.appendLine(t("done"));

        try {
          const data: SocketEventUploadData = JSON.parse(reason.toString());

          if (data.progress.log) showLog(data.progress.log);

          if (data.message) showApiMessage(data);
        } catch { }
      });

    extension.context.subscriptions.push(logger, ws);

    ws.connect().catch(reject);
  });
}

function showApiMessage(data: Data) {
  if ("status" in data) {
    window.showInformationMessage(
      t(`${data.status}`)
      + (typeof data.statusCode === "number" ? ` ${data.statusCode}` : "")
      + (data.message ? `: ${data.message}` : ""),
    );
  }
}

interface Data {
  status?: string
  statusCode?: number
  message?: string | null
}
