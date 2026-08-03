import { t } from "@vscode/l10n";
import { ExtensionContextId } from "../@enum";
import type ExtensionCore from "../core/extension";

export default async function (core: ExtensionCore) {
  await Promise.all([
    core.setContext(ExtensionContextId.discloudAuthorized, false),
    core.setContext(ExtensionContextId.discloudUnauthorized, false),
  ]);

  core.api.authorized = false;

  core.userTree.clear();
  core.statusBar.setLogin();

  core.logger.warn(t("missing.token"));
}
