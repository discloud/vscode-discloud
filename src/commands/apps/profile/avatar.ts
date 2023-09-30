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

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
      if (!item) throw Error(t("missing.appid"));
    }

    const avatarURL = await window.showInputBox({
      prompt: t("input.avatar.prompt"),
      validateInput(value) {
        if (!/^(https?:\/\/.+\.(?:jpe?g|png))(?:\?.*)?$/.test(value))
          return t("input.avatar.prompt");
      },
    });

    if (!avatarURL) throw Error("Missing input");

    if (!await this.confirmAction())
      throw Error("Reject action");

    const res = await requester<RESTApiBaseResult>(Routes.appProfile(item.appId), {
      body: JSON.stringify({
        avatarURL,
      }),
      method: "PUT",
    });
    if (!res) return;

    if ("status" in res) {
      this.showApiMessage(res);

      if (res.status === "ok") {
        extension.appTree.edit(item.appId, <BaseApiApp>{ id: item.appId, avatarURL });

        new DiscloudConfig(extension.workspaceFolder!).update({ AVATAR: avatarURL });
      }
    }
  }
}
