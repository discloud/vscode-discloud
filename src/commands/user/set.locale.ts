import { t } from "@vscode/l10n";
import { commands, window } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import DiscloudAPIError from "../../services/discloud/error";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super();
  }

  async run(_: TaskData, localeList?: string[]) {
    let locale;

    if (localeList?.length) {
      locale = await window.showQuickPick(localeList, {
        title: t("input.set.locale.available.title"),
      });
    } else {
      locale = await window.showInputBox({
        prompt: t("input.set.locale.prompt"),
        validateInput(value) {
          if (!/[a-z]{2}[-_][A-Z]{2}/.test(value))
            return t("input.set.locale.validate");
        },
      });
    }

    if (!locale) throw Error(t("missing.locale"));

    if (!await this.confirmAction())
      throw Error(t("rejected.action"));

    try {
      const response = await extension.user.setLocale(locale);
      if (!response) return;

      if (response.status === "ok")
        this.showApiMessage(response);
    } catch (error) {
      if (error instanceof DiscloudAPIError)
        if ("localeList" in error.body)
          commands.executeCommand("discloud.user.set.locale", error.body.localeList);
    }
  }
}
