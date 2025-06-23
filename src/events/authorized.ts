import { commands } from "vscode";
import extension from "../extension";

extension.on("authorized", async function () {
  commands.executeCommand("setContext", "discloudTokenAuthorized", true);
  commands.executeCommand("setContext", "discloudTokenUnauthorized", false);

  extension.api.tokenIsValid = true;

  await extension.statusBar.setDefault();

  extension.logger.info("Authorized");
});
