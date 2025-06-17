import { t } from "@vscode/l10n";
import { window } from "vscode";
import { tokenIsDiscloudJwt, tokenValidator } from "../services/discloud/utils";
import Command from "../structures/Command";

export default class extends Command {
  constructor() {
    super({
      allowTokenless: true,
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

    if (!input) throw Error(t("invalid.input"));

    if (!await tokenValidator(input))
      throw Error(t("invalid.token"));

    await window.showInformationMessage(t("valid.token"));
  }
}
