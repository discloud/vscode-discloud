import { t } from "@vscode/l10n";
import extension from "../extension";

extension.on("missingToken", async function () {
  extension.userTree.clear();
  extension.statusBar.setLogin();

  extension.logger.warn(t("missing.token"));
});
