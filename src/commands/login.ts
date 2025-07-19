import { t } from "@vscode/l10n";
import { authentication, type AuthenticationSession, window } from "vscode";
import { type TaskData } from "../@types";
import { UnauthorizedError } from "../authentication/errors/unauthorized";
import type ExtensionCore from "../core/extension";
import Command from "../structures/Command";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super({
      allowTokenless: true,
    });
  }

  async run(_: TaskData, session?: AuthenticationSession) {
    session ??= await authentication.getSession("discloud", [], { forceNewSession: true });

    try {
      await this.core.auth.pat.validate(session);

      this.core.emit("authorized");

      void this.core.user.fetch(true);

      void window.showInformationMessage(t("valid.token"));
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw Error(t("invalid.token"));
      }

      throw error;
    }
  }
}
