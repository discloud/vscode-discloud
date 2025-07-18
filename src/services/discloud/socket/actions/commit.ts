import { t } from "@vscode/l10n";
import bytes from "bytes";
import { Routes } from "discloud.app";
import { stripVTControlCharacters } from "util";
import { window } from "vscode";
import { type TaskData } from "../../../../@types";
import core from "../../../../extension";
import type TeamAppTreeItem from "../../../../structures/TeamAppTreeItem";
import UserAppTreeItem from "../../../../structures/UserAppTreeItem";
import { MAX_FILE_SIZE } from "../../constants";
import SocketClient from "../client";
import { SocketEvents } from "../enum/events";
import { type SocketEventUploadData } from "../types";

export async function socketCommit(task: TaskData, buffer: Buffer, app: UserAppTreeItem | TeamAppTreeItem) {
  await new Promise<void>((resolve, reject) => {
    const debugCode = app.appId;

    function debug(message: string, ...args: unknown[]) {
      core.debug(`%s ${message}`, debugCode, ...args);
    }

    const value = `${bytes(buffer.length)}`;

    debug("File size: %s", value);

    if (buffer.length > MAX_FILE_SIZE) return reject(t("file.too.big", { value }));

    const isUserApp = app instanceof UserAppTreeItem;
    const appTree = isUserApp ? core.userAppTree : core.teamAppTree;

    const url = new URL(`${core.api.baseURL}/ws${isUserApp ? Routes.appCommit(app.appId) : Routes.teamCommit(app.appId)}`);

    function showLog(value: string) {
      const lines = stripVTControlCharacters(value).replace(/^[\r\n]+|[\r\n]+$/g, "").split(/[\r\n]+/);
      for (const text of lines) app.output.info(text);
      queueMicrotask(() => app.output.show(true));
    }

    function showError(error: Error) {
      app.output.error(error);
      queueMicrotask(() => app.output.show(true));
    }

    const status = {
      uploading: false,
    };

    const ws = new SocketClient<SocketEventUploadData>(url)
      .once(SocketEvents.close, async (code, reason) => {
        debug(SocketEvents.close, code);

        resolve();

        if (code !== 1000)
          return void window.showErrorMessage(t(`socket.close.${code}`));

        if (!reason.length) return app.output.append(t("done"));

        try {
          const data: SocketEventUploadData = JSON.parse(reason.toString());

          if (data.progress.log) showLog(data.progress.log);

          if (data.message) showApiMessage(data);
        } catch { }
      })
      .on(SocketEvents.connected, async () => {
        debug(SocketEvents.connected);
        status.uploading = true;

        task.progress.report({ increment: -1, message: t("committing") });

        await ws.sendBuffer(buffer, (data) => {
          debug("send progress %o/%o", data.current, data.total);
          task.progress.report({ increment: 100 / data.total });
        });

        task.progress.report({ increment: -1 });

        status.uploading = false;
      })
      .on(SocketEvents.connecting, () => {
        debug(SocketEvents.connecting);
        task.progress.report({ increment: -1, message: t("socket.connecting") });
      })
      .on(SocketEvents.data, (data) => {
        debug("data received with status %s %o", data.status, data.statusCode);

        if (data.progress) {
          // if (!status.uploading) task.progress.report({ increment: data.progress.bar });

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
      .on(SocketEvents.error, (error) => {
        debug(SocketEvents.error, error.message);
        showError(error);
      });

    core.context.subscriptions.push(ws);

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
