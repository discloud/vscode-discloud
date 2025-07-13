import { commands } from "vscode";
import extension from "../extension";

extension.on("authorized", async function () {
  await Promise.all([
    commands.executeCommand("setContext", "discloudAuthAuthorized", true),
    commands.executeCommand("setContext", "discloudAuthUnauthorized", false),
  ]);

  extension.api.tokenIsValid = true;

  await extension.statusBar.setDefault();

  extension.logger.info("Authorized");
});
