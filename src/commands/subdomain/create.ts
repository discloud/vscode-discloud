import { t } from "@vscode/l10n";
import { ProgressLocation, window } from "vscode";
import { type RESTPostApiSubdomainResult, type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";

const SUBDOMAIN_NAME_REGEXP = /^[a-z0-9-]{2,20}$/;

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.subdomain.create.title"),
      },
    });
  }

  async run(_: TaskData, subdomainName?: string) {
    if (typeof subdomainName !== "string" || !SUBDOMAIN_NAME_REGEXP.test(subdomainName)) {
      subdomainName = await window.showInputBox({
        prompt: t("input.subdomain.prompt"),
        validateInput(value) {
          if (!SUBDOMAIN_NAME_REGEXP.test(value))
            return t("input.subdomain.validate");
        },
      });
    }

    if (!subdomainName) throw Error(t("missing.subdomain"));

    const response = await this.core.api.post<RESTPostApiSubdomainResult>(`/subdomain/${subdomainName}`);
    if (!response) return;

    void window.showInformationMessage(response.message ?? t("done"));

    await this.core.user.fetch(true);
  }
}
