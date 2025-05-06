import { t } from "@vscode/l10n";
import { type BaseApiApp, DiscloudConfig, DiscloudConfigScopes, type RESTApiBaseResult, Routes } from "discloud.app";
import { type TaskData } from "../../../@types";
import extension from "../../../extension";
import type AppTreeItem from "../../../structures/AppTreeItem";
import Command from "../../../structures/Command";
import InputBox from "../../../util/Input";
import { CancellationError } from "vscode";

export default class extends Command {
  constructor() {
    super();
  }

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const avatarURL = await InputBox.getExternalImageURL({
      prompt: t("input.avatar.prompt"),
      required: true,
    });

    if (!await this.confirmAction())
      throw new CancellationError();

    const res = await extension.api.put<RESTApiBaseResult>(Routes.appProfile(item.appId), { body: { avatarURL } });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      if (res.status === "ok") {
        extension.appTree.editRawApp(item.appId, <BaseApiApp>{ id: item.appId, avatarURL });

        const workspaceFolder = await extension.getWorkspaceFolder();

        if (workspaceFolder) {
          const dConfig = new DiscloudConfig(workspaceFolder.fsPath);

          const ID = dConfig.get(DiscloudConfigScopes.ID);

          if (ID === item.appId) dConfig.update({ AVATAR: avatarURL });
        }
      }
    }
  }
}
