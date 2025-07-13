import { t } from "@vscode/l10n";
import { commands } from "vscode";
import core from "../extension";

core.on("missingToken", async function () {
  await Promise.all([
    commands.executeCommand("setContext", "discloudAuthorized", false),
    commands.executeCommand("setContext", "discloudUnauthorized", false),
  ]);

  core.api.authorized = false;

  core.userTree.clear();
  core.statusBar.setLogin();

  core.logger.warn(t("missing.token"));
});
