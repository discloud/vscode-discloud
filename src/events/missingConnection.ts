import { t } from "@vscode/l10n";
import extension from "../extension";

extension.on("missingConnection", async function () {
  extension.resetStatusBar();

  extension.logger.error(t("missing.connection"));
});
