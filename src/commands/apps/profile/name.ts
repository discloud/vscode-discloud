import { t } from "@vscode/l10n";
import { type BaseApiApp, DiscloudConfig, type RESTApiBaseResult, Routes } from "discloud.app";
import { window } from "vscode";
import { type TaskData } from "../../../@types";
import extension from "../../../extension";
import type AppTreeItem from "../../../structures/AppTreeItem";
import Command from "../../../structures/Command";

export default class extends Command {
  constructor() {
    super();
  }

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const name = await window.showInputBox({
      prompt: t("input.name.prompt"),
      validateInput(value) {
        if (value.length > 30)
          return t("input.name.prompt");
      },
    });

    if (!name) throw Error(t("missing.input"));

    if (!await this.confirmAction())
      throw Error(t("rejected.action"));

    const res = await extension.rest.put<RESTApiBaseResult>(Routes.appProfile(item.appId), { body: { name } });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      if (res.status === "ok") {
        extension.appTree.editRawApp(item.appId, <BaseApiApp>{ id: item.appId, name });

        const workspaceFolder = await extension.getWorkspaceFolder();

        if (workspaceFolder) {
          const dConfig = new DiscloudConfig(workspaceFolder.fsPath);
          queueMicrotask(() => dConfig.dispose());

          if (dConfig.data.ID === item.appId) dConfig.update({ NAME: name });
        }
      }
    }
  }
}
