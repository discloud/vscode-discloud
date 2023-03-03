import { t } from "@vscode/l10n";
import { commands, window } from "vscode";
import { TaskData } from "../../@types";
import extension from "../../extension";
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

    if (!locale) throw Error("Missing locale");

    if (!await this.confirmAction())
      throw Error("Reject action");

    const res = await extension.user.setLocale(locale);

    if (res.status === "ok")
      this.showApiMessage(res);

    if ("localeList" in res) {
      await commands.executeCommand("discloud.user.set.locale", res.localeList);
    }
  }
}