import { t } from "@vscode/l10n";
import { DiscloudConfig } from "discloud.app";
import stripAnsi from "strip-ansi";
import { CancellationError, ProgressLocation, Uri, window } from "vscode";
import { type TaskData } from "../@types";
import extension from "../extension";
import SocketUploadClient from "../services/discloud/socket/upload/client";
import { type SocketEventUploadData } from "../services/discloud/socket/upload/types";
import Command from "../structures/Command";
import FileSystem from "../util/FileSystem";
import Zip from "../util/Zip";

export default class extends Command {
  constructor() {
    super({
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.upload.title"),
      },
    });
  }

  async run(task: TaskData) {
    const workspaceFolder = await extension.getWorkspaceFolder();
    if (!workspaceFolder) throw Error(t("no.workspace.folder.found"));

    if (!await this.confirmAction())
      throw new CancellationError();

    extension.statusBar.setUploading();

    task.progress.report({ increment: 30, message: t("files.checking") });

    const dConfig = new DiscloudConfig(workspaceFolder.fsPath);

    if (!dConfig.validate(true))
      throw Error(t("invalid.discloud.config"));

    const fs = new FileSystem({
      ignoreFile: ".discloudignore",
      ignoreList: extension.workspaceIgnoreList,
    });

    const found = await fs.findFiles(task.token);
    if (!found.length) throw Error(t("files.missing"));

    const main = Uri.parse(dConfig.data.MAIN).fsPath;

    if (!found.some(uri => uri.fsPath.endsWith(main)))
      throw Error([
        t("missing.discloud.config.main", { file: dConfig.data.MAIN }),
        t("readdiscloudconfigdocs"),
      ].join("\n"));

    task.progress.report({ increment: 30, message: t("files.zipping") });

    const zipper = new Zip();

    await zipper.appendUriList(found);

    const buffer = await zipper.getBuffer();

    await this.socketUpload(task, buffer);
  }

  async socketUpload(task: TaskData, buffer: Buffer) {
    await new Promise<void>(r => {
      const url = new URL(`${extension.api.baseURL}/ws/upload`);

      let connected = false;

      const logger = window.createOutputChannel("Discloud Upload");

      function showLog(value: string) {
        logger.appendLine(stripAnsi(value));

        queueMicrotask(() => logger.show(true));
      }

      const ws = new SocketUploadClient(url, { headers: { "api-token": extension.api.token! } })
        .on("connecting", () => {
          task.progress.report({ increment: -1, message: t("socket.upload.connecting") });
        })
        .on("connect", async () => {
          connected = true;

          task.progress.report({ increment: -1, message: t("uploading") });

          await ws.sendFile(buffer);
        })
        .on("upload", (data) => {
          if (data.progress) {
            task.progress.report({ increment: data.progress.bar });

            if (data.progress.log) {
              showLog(data.progress.log.replace(/[\r\n]+$/, ""));
            }
          }

          if (data.message) {
            this.showApiMessage(data);
          }
        })
        .on("error", (error) => {
          extension.logger.error(error);
        })
        .once("close", async (code, reason) => {
          r();

          ws.dispose();

          if (!connected) {
            if (code === 1008) return;
            await window.showErrorMessage(t("socket.upload.connecting.fail"));
            return;
          }

          const message = reason.toString();

          if (!message) return logger.appendLine(t("done"));

          let data!: SocketEventUploadData;
          try {
            data = JSON.parse(message);

            if (data.progress) {
              task.progress.report({ increment: data.progress.bar });

              if (data.progress.log) {
                showLog(data.progress.log.replace(/[\r\n]+$/, ""));
              }
            }

            if (data.message) {
              this.showApiMessage(data);
            }
          } catch { }
        });

      extension.context.subscriptions.push(logger, ws);

      ws.connect();
    });
  }
}
