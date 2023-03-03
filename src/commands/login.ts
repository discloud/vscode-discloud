import { t } from "@vscode/l10n";
import { window } from "vscode";
import Command from "../structures/Command";
import { tokenIsDiscloudJwt, tokenValidator } from "../util";

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
      validateInput(value: string) {
        if (!tokenIsDiscloudJwt(value))
          return t("input.login.prompt");
      },
    });

    if (!input) throw Error("Invalid input");

    if (!await tokenValidator(input)) {
      window.showErrorMessage(t("invalid.token"));

      throw Error(t("invalid.token"));
    }

    window.showInformationMessage(t("valid.token"));
  }
}
