import { t } from "@vscode/l10n";
import { window } from "vscode";
import extension from "../../extension";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super();
  }

  async run() {
    const locale = await window.showInputBox({
      prompt: t("input.set.locale.prompt"),
      validateInput(value) {
        if (!/[a-z]{2}[-_][A-Z]{2}/.test(value))
          return t("input.set.locale.validate");
      },
    });
    if (!locale) throw Error("Missing locale");

    if (!await this.confirmAction())
      throw Error("Reject action");

    const res = await extension.user.setLocale(locale);

    this.showApiMessage(res);
  }
}