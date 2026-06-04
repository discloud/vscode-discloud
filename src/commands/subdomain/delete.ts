import { t } from "@vscode/l10n";
import { ProgressLocation, window } from "vscode";
import { type RESTDeleteApiSubdomainResult, type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type SubDomainTreeItem from "../../structures/SubDomainTreeItem";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      progress: {
        location: ProgressLocation.Notification,
        title: t("progress.subdomain.delete.title"),
      },
    });
  }

  async run(_: TaskData, item: SubDomainTreeItem) {
    const subdomainName = item.subdomain;

    await this.confirmAction({
      action: subdomainName,
      throwOnReject: true,
      title: "action.title",
      type: "showWarningMessage",
    });

    const response = await this.core.api.delete<RESTDeleteApiSubdomainResult>(`/subdomain/${subdomainName}`);
    if (!response) return;

    void window.showInformationMessage(response.message ?? t("done"));

    await this.core.user.fetch(true);
  }
}
