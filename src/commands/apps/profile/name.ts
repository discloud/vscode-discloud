import { t } from "@vscode/l10n";
import { type BaseApiApp, DiscloudConfig, DiscloudConfigScopes, type RESTApiBaseResult, Routes } from "discloud.app";
import { CancellationError, window } from "vscode";
import { type TaskData } from "../../../@types";
import type ExtensionCore from "../../../core/extension";
import Command from "../../../structures/Command";
import type UserAppTreeItem from "../../../structures/UserAppTreeItem";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super();
  }

  async run(_: TaskData, item: UserAppTreeItem) {
    const name = await window.showInputBox({
      prompt: t("input.name.prompt"),
      validateInput(value) {
        if (value.length > 30)
          return t("input.name.prompt");
      },
    });

    if (!name) throw Error(t("missing.input"));

    if (!await this.confirmAction())
      throw new CancellationError();

    const response = await this.core.api.put<RESTApiBaseResult>(Routes.appProfile(item.appId), { body: { name } });
    if (!response) return;

    if ("status" in response) {
      this.showApiMessage(response);

      if (response.status === "ok") {
        this.core.userAppTree.editRawApp(item.appId, <BaseApiApp>{ id: item.appId, name });

        const workspaceFolder = await this.core.getWorkspaceFolder({ fallbackUserChoice: false });

        if (workspaceFolder) {
          const dConfig = await DiscloudConfig.fromPath(workspaceFolder.fsPath);

          const ID = dConfig.get(DiscloudConfigScopes.ID);

          if (ID === item.appId) dConfig.update({ NAME: name });
        }
      }
    }
  }
}
