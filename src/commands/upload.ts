import { t } from "@vscode/l10n";
import { DiscloudConfig, resolveFile, type RESTPostApiUploadResult, Routes } from "discloud.app";
import stripAnsi from "strip-ansi";
import { CancellationError, ProgressLocation, Uri, window } from "vscode";
import { type TaskData } from "../@types";
import extension from "../extension";
import SocketUploadClient from "../services/discloud/socket/upload/client";
import { type SocketEventUploadData } from "../services/discloud/socket/upload/types";
import Command from "../structures/Command";
import FileSystem from "../util/FileSystem";
import Zip from "../util/Zip";
import { ConfigKeys, UploadStrategy } from "../util/constants";

type UploadStrategy = typeof UploadStrategy
type UploadStrategies = UploadStrategy[keyof UploadStrategy]

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

    const strategy = extension.config.get<UploadStrategies>(ConfigKeys.uploadStrategy, UploadStrategy.socket);

    await this[strategy](task, buffer, dConfig);
  }

  async rest(task: TaskData, buffer: Buffer, dConfig: DiscloudConfig) {
    task.progress.report({ increment: -1, message: t("uploading") });

    const file = await resolveFile(buffer, "file.zip");

    const files: File[] = [file];

    const res = await extension.api.post<RESTPostApiUploadResult>(Routes.upload(), { files });

    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      if ("app" in res && res.app) {
        dConfig.update({ ID: res.app.id, AVATAR: res.app.avatarURL });
        await extension.appTree.fetch();
      }

      if (res.logs) {
        this.logger("app" in res && res.app ? res.app.id : "Discloud Upload Error", res.logs);
      }
    }
  }

  async socket(task: TaskData, buffer: Buffer, dConfig: DiscloudConfig) {
    await new Promise<void>(r => {
      const url = new URL(`${extension.api.baseURL}/ws/upload`);

      let connected = false;

      const logger = window.createOutputChannel("Discloud Upload");

      function showLog(value: string) {
        logger.appendLine(stripAnsi(value.replace(/[\r\n]+$/, "")));
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
              showLog(data.progress.log);
            }
          }

          if (data.message) {
            this.showApiMessage(data);
          }

          if (data.app) {
            dConfig.update({ ID: data.app.id, AVATAR: data.app.avatarURL });
            extension.appTree.fetch();
          }

          if (data.logs) {
            showLog(data.logs);
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
                showLog(data.progress.log);
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
