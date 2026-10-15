import { t } from "@vscode/l10n";
import { authentication, window, type AuthenticationSession } from "vscode";
import type { TaskData } from "../@types";
import AuthenticationProviderPicker from "../authentication/dialogs/AuthenticationProviderPicker";
import UnauthorizedError from "../authentication/errors/unauthorized";
import type ExtensionCore from "../core";
import Command from "../structures/Command";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      allowTokenless: true,
    });
  }

  async run(_: TaskData, session?: AuthenticationSession) {
    if (!session) await this.createSession();

    this.core.emit("authorized", this.core);

    setTimeout(() => this.core.user.fetch(true));
  }

  async createSession() {
    try {
      const providerId = await AuthenticationProviderPicker.pick();
      if (!providerId) throw Error(t("cancelled"));
      await authentication.getSession(providerId, [], { forceNewSession: true });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw Error(t("invalid.token"), { cause: error });
      }

      throw error;
    }

    void window.showInformationMessage(t("valid.token"));
  }
}
