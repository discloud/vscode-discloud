import { SocketClient, type SocketEventUploadData } from "@discloudapp/ws";
import { t } from "@vscode/l10n";
import bytes from "bytes";
import { Routes, type DiscloudConfig } from "discloud.app";
import { stripVTControlCharacters } from "util";
import { window } from "vscode";
import { type ApiVscodeApp, type TaskData } from "../../../../@types";
import extension from "../../../../extension";
import { MAX_FILE_SIZE } from "../../constants";

export async function socketUpload(task: TaskData, buffer: Buffer, dConfig: DiscloudConfig) {
  await new Promise<void>((resolve, reject) => {
    const debugCode = Date.now();

    function debug(message: string, ...args: unknown[]) {
      extension.debug(`%o ${message}`, debugCode, ...args);
    }

    const value = `${bytes(buffer.length)}`;

    debug("File size: %s", value);

    if (buffer.length > MAX_FILE_SIZE) return reject(t("file.too.big", { value }));

    const url = new URL(`${extension.api.baseURL}/ws${Routes.upload()}`);

    const logger = window.createOutputChannel("Discloud Upload", { log: true });

    function showLog(value: string) {
      const lines = stripVTControlCharacters(value).replace(/^[\r\n]+|[\r\n]+$/g, "").split(/[\r\n]+/);
      for (const text of lines) logger.info(text);
      queueMicrotask(() => logger.show(true));
    }

    function showError(error: Error) {
      logger.error(error);
      queueMicrotask(() => logger.show(true));
    }

    const status = {
      authenticated: false,
      connected: false,
      uploading: false,
    };

    const socket = new SocketClient<SocketEventUploadData>(url, {
      headers: {
        "api-token": extension.token!,
        ...extension.api.options.userAgent ? { "User-Agent": `${extension.api.options.userAgent}` } : {},
      },
    })
      .once("close", async (code, reason) => {
        debug("close", code);

        resolve();

        if (!status.connected || !status.authenticated) return;

        setTimeout(() => logger.dispose(), 60_000);

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
      })
      .on("connecting", () => {
        debug("connecting");
        task.progress.report({ increment: -1, message: t("socket.connecting") });
      })
      .on("connectionFailed", async () => {
        resolve();
        const message = t("socket.connecting.fail");
        debug(message);
        showLog(message);
        await window.showErrorMessage(message);
        setTimeout(() => logger.dispose(), 60_000);
      })
      .on("connected", async () => {
        debug("connected");
        status.authenticated = status.connected = status.uploading = true;

        showLog("-".repeat(60));

        task.progress.report({ increment: -1, message: t("uploading") });

        await socket.sendBuffer(buffer, (data) => {
          debug("progress received %o/%o", data.current, data.total);
          task.progress.report({ increment: 100 / data.total });
        });

        task.progress.report({ increment: -1 });

        status.uploading = false;
      })
      .on("data", async (data) => {
        debug("data received with status %s %o", data.status, data.statusCode);

        if (data.progress) {
          if (!status.uploading) task.progress.report({ increment: data.progress.bar });

          if (data.progress.log) showLog(data.progress.log);
        }

        if (data.message) showApiMessage(data);

        if (data.app) {
          dConfig.update({ ID: data.app.id, AVATAR: data.app.avatarURL });

          const app: ApiVscodeApp = {
            apts: dConfig.data.APT ?? [],
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
        debug("error", error.message);
        showError(error);
      })
      .on("unauthorized", async () => {
        resolve();
        const message = t("socket.authentication.fail");
        debug(message);
        showLog(message);
        await window.showErrorMessage(message);
        setTimeout(() => logger.dispose(), 60_000);
      });

    extension.context.subscriptions.push(logger, socket);

    socket.connect().catch(reject);
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
