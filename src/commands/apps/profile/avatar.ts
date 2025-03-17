import { t } from "@vscode/l10n";
import { type BaseApiApp, DiscloudConfig, type RESTApiBaseResult, Routes } from "discloud.app";
import { window } from "vscode";
import { type TaskData } from "../../../@types";
import extension from "../../../extension";
import type AppTreeItem from "../../../structures/AppTreeItem";
import Command from "../../../structures/Command";
import { IMAGE_URL_REGEXP } from "../../../util/regexp";

export default class extends Command {
  constructor() {
    super();
  }

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    let avatarURL = await window.showInputBox({
      prompt: t("input.avatar.prompt"),
      validateInput(value) {
        if (!IMAGE_URL_REGEXP.test(value))
          return t("input.avatar.prompt");
      },
    });

    if (!avatarURL) throw Error(t("missing.input"));

    if (!await this.confirmAction())
      throw Error(t("rejected.action"));

    avatarURL = avatarURL.replace(/\s+/g, "");

    const res = await extension.api.put<RESTApiBaseResult>(Routes.appProfile(item.appId), { body: { avatarURL } });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      if (res.status === "ok") {
        extension.appTree.editRawApp(item.appId, <BaseApiApp>{ id: item.appId, avatarURL });

        const workspaceFolder = await extension.getWorkspaceFolder();

        if (workspaceFolder) {
          const dConfig = new DiscloudConfig(workspaceFolder.fsPath);
          queueMicrotask(() => dConfig.dispose());

          if (dConfig.data.ID === item.appId) dConfig.update({ AVATAR: avatarURL });
        }
      }
    }
  }
}
