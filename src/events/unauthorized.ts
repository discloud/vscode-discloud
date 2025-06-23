import { commands } from "vscode";
import extension from "../extension";

extension.on("unauthorized", async function () {
  commands.executeCommand("setContext", "discloudTokenAuthorized", false);
  commands.executeCommand("setContext", "discloudTokenUnauthorized", true);

  extension.api.tokenIsValid = false;

  extension.userTree.clear();

  extension.statusBar.setLogin();

  extension.logger.warn("Unauthorized");
});
