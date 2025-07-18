import { t } from "@vscode/l10n";
import { type BaseApiApp, DiscloudConfig, DiscloudConfigScopes, type RESTApiBaseResult, Routes } from "discloud.app";
import { CancellationError } from "vscode";
import { type TaskData } from "../../../@types";
import type ExtensionCore from "../../../core/extension";
import Command from "../../../structures/Command";
import type UserAppTreeItem from "../../../structures/UserAppTreeItem";
import InputBox from "../../../utils/Input";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super();
  }

  async run(_: TaskData, item: UserAppTreeItem) {
    const avatarURL = await InputBox.getExternalImageURL({
      prompt: t("input.avatar.prompt"),
      required: true,
    });

    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await this.core.api.put<RESTApiBaseResult>(Routes.appProfile(item.appId), { body: { avatarURL } });
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      if (response.status === "ok") {
        this.core.userAppTree.editRawApp(item.appId, <BaseApiApp>{ id: item.appId, avatarURL });

        const workspaceFolder = await this.core.getWorkspaceFolder({ fallbackUserChoice: false });

        if (workspaceFolder) {
          const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

          const ID = dConfig.get(DiscloudConfigScopes.ID);

          if (ID === item.appId) dConfig.update({ AVATAR: avatarURL });
        }
      }
    }
  }
}
