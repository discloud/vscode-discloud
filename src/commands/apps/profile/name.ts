import { t } from "@vscode/l10n";
import { DiscloudConfig, RESTApiBaseResult, Routes } from "discloud.app";
import { window } from "vscode";
import { BaseApiApp, TaskData } from "../../../@types";
import extension from "../../../extension";
import AppTreeItem from "../../../structures/AppTreeItem";
import Command from "../../../structures/Command";
import { requester } from "../../../util";

export default class extends Command {
  constructor() {
    super();
  }

  async run(task: TaskData, item: AppTreeItem = <AppTreeItem>{}) {
    if (!item.appId) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item.appId = picked.id;
      if (!item.appId) throw Error(t("missing.appid"));
    }

    const name = await window.showInputBox({
      prompt: t("input.name.prompt"),
      validateInput(value) {
        if (value.length > 30)
          return t("input.name.prompt");
      },
    });

    if (!name) throw Error("Missing input");

    if (!await this.confirmAction())
      throw Error("Reject action");

    const res = await requester<RESTApiBaseResult>(Routes.appProfile(item.appId), {
      body: JSON.stringify({
        name,
      }),
      method: "PUT",
    });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      if (res.status === "ok") {
        extension.appTree.edit(item.appId, <BaseApiApp>{ id: item.appId, name });

        new DiscloudConfig(extension.workspaceFolder!).update({ NAME: name });
      }
    }
  }
}
