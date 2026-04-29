import { t } from "@vscode/l10n";
import { setTimeout as sleep } from "timers/promises";
import { authentication, window, type AuthenticationSession } from "vscode";
import { type TaskData } from "../@types";
import UnauthorizedError from "../authentication/errors/unauthorized";
import { pickAuthenticationProviderId } from "../authentication/pick/AuthenticationProviderPicker";
import type ExtensionCore from "../core/extension";
import Command from "../structures/Command";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      allowTokenless: true,
    });
  }

  async run(_: TaskData, session?: AuthenticationSession) {
    if (!session) {
      try {
        const providerId = await pickAuthenticationProviderId();
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

    this.core.emit("authorized");

    await sleep();

    await this.core.user.fetch(true);
  }
}
