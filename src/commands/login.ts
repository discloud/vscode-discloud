import { t } from "@vscode/l10n";
import { window } from "vscode";
import type ExtensionCore from "../core/extension";
import { tokenIsDiscloudJwt, tokenValidator } from "../services/discloud/utils";
import Command from "../structures/Command";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
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

    const authorization = await tokenValidator(input);

    if (typeof authorization !== "boolean") return;

    if (!authorization) throw Error(t("invalid.token"));

    await this.core.secrets.setToken(input);

    void window.showInformationMessage(t("valid.token"));
  }
}
