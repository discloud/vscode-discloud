import { Routes } from "@discloudapp/api-types/v2";
import { type DiscloudConfig } from "@discloudapp/util";
import { t } from "@vscode/l10n";
import bytes from "bytes";
import { stripVTControlCharacters } from "util";
import { window } from "vscode";
import { type TaskData } from "../../../../@types";
import type ExtensionCore from "../../../../core/extension";
import { MAX_FILE_SIZE } from "../../constants";
import SocketClient from "../client";
import { SocketEvents } from "../enum/events";
import { type SocketEventUploadData } from "../types";

export async function socketUpload(core: ExtensionCore, task: TaskData, buffer: Buffer, dConfig: DiscloudConfig) {
  await new Promise<void>((resolve, reject) => {
    const debugCode = Date.now();

    function debug(message: string, ...args: unknown[]) {
      core.debug(`%o ${message}`, debugCode, ...args);
    }

    const value = `${bytes(buffer.length)}`;

    debug("File size: %s", value);

    if (buffer.length > MAX_FILE_SIZE) return reject(t("file.too.big", { value }));

    const url = new URL(`${core.api.baseURL}/ws${Routes.upload()}`);

    const logger = core.getLogOutputChannel("Discloud Upload");

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
      uploading: false,
    };

    const ws = new SocketClient<SocketEventUploadData>(url)
      .once(SocketEvents.close, async (code, _reason) => {
        debug(SocketEvents.close, code);

        resolve();

        if (code !== 1000) {
          logger.dispose(60_000);
          return void window.showErrorMessage(t(`socket.close.${code}`));
        }

        logger.appendLine(t("done"));

        logger.dispose(60_000);
      })
      .on(SocketEvents.connecting, () => {
        debug(SocketEvents.connecting);
        task.progress.report({ increment: -1, message: t("socket.connecting") });
      })
      .on(SocketEvents.connected, async () => {
        debug(SocketEvents.connected);
        status.uploading = true;

        showLog("-".repeat(60));

        task.progress.report({ increment: -1, message: t("uploading") });

        await ws.sendBuffer(buffer, (data) => {
          debug("send progress %o/%o", data.current, data.total);
          task.progress.report({ increment: 100 / data.total });
        });

        task.progress.report({ increment: -1 });

        status.uploading = false;
      })
      .on(SocketEvents.data, async (data) => {
        debug(SocketEvents.connected, data.status, data.statusCode);

        if (data.progress) {
          // if (!status.uploading) task.progress.report({ increment: data.progress.bar });

          if (data.progress.log) showLog(data.progress.log);
        }

        if (data.message) showApiMessage(data);

        if (data.app) {
          dConfig.update({ ID: data.app.id, AVATAR: data.app.avatarURL });

          data.app.apts = dConfig.data.APT ?? [];

          core.userAppTree.addRawApp(data.app);
        }

        if (data.logs) showLog(data.logs);
      })
      .on(SocketEvents.error, (error) => {
        debug(SocketEvents.error, error.message);
        showError(error);
      });

    core.context.subscriptions.push(logger, ws);

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
