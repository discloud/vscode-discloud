import { commands } from "vscode";
import extension from "../extension";

extension.on("unauthorized", async function () {
  await Promise.all([
    commands.executeCommand("setContext", "discloudAuthAuthorized", false),
    commands.executeCommand("setContext", "discloudAuthUnauthorized", true),
  ]);

  extension.api.tokenIsValid = false;

  extension.userTree.clear();

  extension.statusBar.setLogin();

  extension.logger.warn("Unauthorized");
});
