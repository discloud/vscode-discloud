import { t } from "@vscode/l10n";
import { window } from "vscode";
import Command from "../structures/Command";
import { tokenValidator } from "../util";

export default class extends Command {
  constructor() {
    super({
      noToken: true,
    });
  }

  async run() {
    const input = await window.showInputBox({
      password: true,
      prompt: t("input.login.prompt"),
    });

    if (!input) return;

    if (!await tokenValidator(input)) {
      window.showErrorMessage(t("invalid.token"));

      return false;
    }

    window.showInformationMessage(t("valid.token"));
  }
}
